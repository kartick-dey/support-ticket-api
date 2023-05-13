import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AttachementDocument,
  ATTACHEMENT_MODEL,
} from 'src/schemas/attachement';
import * as fileSys from 'fs';
import * as path from 'path';
import * as util from 'util';
import { IAttachment } from 'src/models';

import * as fs from 'fs-extra';

import { ObjectId } from 'bson';
import { Constants } from 'src/utils/constant';

@Injectable()
export class AttachmentService {
  private pathExists = util.promisify(fileSys.exists);
  private mkdir = util.promisify(fileSys.mkdir);
  private fsWriteFile = util.promisify(fileSys.writeFile);

  private readonly logger = new Logger(AttachmentService.name);

  constructor(
    @InjectModel(ATTACHEMENT_MODEL)
    private readonly attachmentModel: Model<AttachementDocument>,
    private readonly config: ConfigService
  ) {}

  /**
   * Creating file in drive
   * @param dirPath
   * @param fileName
   * @param file
   * @returns
   */
  private async writeFile(dirPath: string, fileName: string, file: any) {
    try {
      this.logger.log('Executing [writeFile]...');
      const pathExists = await this.pathExists(dirPath);
      const filePath = path.join(dirPath, fileName);
      if (pathExists) {
        await this.fsWriteFile(filePath, file);
      } else {
        await fs.mkdirp(dirPath);
        await this.fsWriteFile(filePath, file);
      }
      return filePath?.toString() || null;
    } catch (error) {
      this.logger.error('Error: [writeFile]', error);
      throw error;
    }
  }

  /**
   * uploading file in attachment collection
   * @param attachement
   * @returns
   */
  public async uploadFile(
    attachement: IAttachment,
    ticketId: string | ObjectId
  ) {
    try {
      this.logger.log('Executing [uploadFile]...');
      if (!attachement.content) {
        this.logger.warn('There is no file content to store');
        return Constants.NO_CONTENT;
      }
      attachement._id = new ObjectId();
      const location = path.join(
        Constants.ENV_ID,
        ticketId.toString(),
        attachement._id.toString()
      );
      const dirPath = path.join(this.config.get('DRIVE_LOCATION'), location);
      const filePath: string = await this.writeFile(
        dirPath,
        attachement.name,
        attachement.content
      );
      this.logger.log(
        `File ${attachement.name} is created under path "${filePath}"...`
      );
      const _attachment = {
        _id: attachement._id,
        name: attachement.name,
        location: location,
        contentType: attachement.contentType,
        size: attachement.size,
        contentDisposition: attachement.contentDisposition,
        contentId: attachement.contentId,
      };
      const file = await this.attachmentModel.create(_attachment);
      return file;
    } catch (error) {
      this.logger.error('Error: [uploadFile]', error);
      throw error;
    }
  }

  public async downloadFile(_id: ObjectId | string) {
    try {
      this.logger.log('Executing [downloadFile]...');
      if (typeof _id === 'string') {
        _id = new ObjectId(_id);
      }
      const file: IAttachment = await this.attachmentModel
        .findOne({ _id: _id })
        .lean();
      if (!file) {
        return null;
      }
      return path.join(
        this.config.get('DRIVE_LOCATION'),
        file.location,
        file.name
      );
    } catch (error) {
      this.logger.error('Error: [downloadFile]', error);
      throw error;
    }
  }

  public async getExistingDocmentsContentIds(contentIds: Array<string>) {
    try {
      const result = await this.attachmentModel
        .find({ contentId: { $in: contentIds } }, { contentId: 1 })
        .lean();
      return result.map((e) => e.contentId);
    } catch (error) {
      this.logger.error('Error: [getExistingDocmentsContentIds]', error);
      throw error;
    }
  }
}
