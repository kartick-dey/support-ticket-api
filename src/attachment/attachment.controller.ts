import {
  Controller,
  Get,
  Logger,
  Param,
  Res,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Request, Response } from 'express';
import { IAttachment } from 'src/models';
import { SharedService } from 'src/shared/shared.service';
import { AttachmentService } from './attachment.service';
import * as shortid from 'shortid';

@Controller('attachment')
export class AttachmentController {
  private readonly logger = new Logger(AttachmentController.name);
  constructor(
    private attachmentSvc: AttachmentService,
    private sharedSvc: SharedService
  ) {}

  @Get('download/:documentid')
  @UseGuards(AuthGuard('jwt'))
  public async download(
    @Param('documentid') documentid: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request for [download]...');
      if (!this.sharedSvc.isValidObjectId(documentid.toString())) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid document id parameter' });
      }
      const fullPath = await this.attachmentSvc.downloadFile(documentid);
      if (!fullPath) {
        return res.status(200).json({
          success: true,
          message: `File not found for given id ${documentid}`,
        });
      }
      // return res.download(fullPath);
      return res.sendFile(fullPath);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to download the file',
      });
    }
  }

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  public async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const _file: IAttachment = {
        name: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        content: file.buffer,
        contentDisposition: 'attachment',
        contentId: shortid.generate()
      };
      const ticketId = req.body?.ticketId?.toString() || 'Orphan Files';
      const resp = await this.attachmentSvc.uploadFile(_file, ticketId);
      res.status(200).json({
        success: true,
        message: 'File is uploaded successfully',
        file: resp,
      });
    } catch (error) {
      this.logger.error('Error: Controller[uploadFile] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to upload the file',
      });
    }
  }
}
