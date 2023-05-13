import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ITicket,
  ITicketEmail,
  ITicketReplyData,
  TICKET_EMAIL_TYPE,
} from 'src/models';
import { TicketService } from './ticket.service';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ObjectId } from 'bson';

@Controller('ticket')
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(private ticketSvc: TicketService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() ticket: ITicket) {
    this.logger.log('Incoming request to create a new ticket');
    return this.ticketSvc.createTicket(ticket);
  }

  @Put('update/:ticketid')
  @UseGuards(AuthGuard('jwt'))
  public async updateTicketById(
    @Body() data: any,
    @Param('ticketid') ticketid: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to update ticket by id');
      const resp = await this.ticketSvc.updateTicketById(
        new ObjectId(ticketid.toString()),
        data
      );
      res.status(200).json({
        success: true,
        message: 'Ticket has been updated successfully',
      });
    } catch (error) {
      this.logger.error('Error: [updateTicketById] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to upodate ticket by id',
      });
    }
  }

  @Get('load/all')
  @UseGuards(AuthGuard('jwt'))
  public async loadAllTickets(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log('Imcoming request to load all tickets');
      const result = await this.ticketSvc.loadAllTickets();
      res.status(200).json({
        success: true,
        tickets: result || [],
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadAllTickets] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to load all tickets',
      });
    }
  }

  @Get('load/filter')
  @UseGuards(AuthGuard('jwt'))
  public async loadTicketsByFilters(
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to load tickets by filters');
      const result = await this.ticketSvc.loadTicketsByFilters(query);
      res.status(200).json({
        success: true,
        tickets: result || [],
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadTicketsByFilters] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to load tickets by filters',
      });
    }
  }

  @Get('load/ticket-email/by/thread/:ticketid/:thread')
  @UseGuards(AuthGuard('jwt'))
  public async loadTicketEmailByThread(
    @Param('ticketid') ticketid: string,
    @Param('thread') thread: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to load ticket email by thread number');
      const threadNum = parseInt(thread.toString());
      ticketid = ticketid.toString() || null;
      const result: ITicketEmail = await this.ticketSvc.loadTicketEmailByThread(
        ticketid,
        threadNum
      );
      res.status(200).json({
        success: true,
        ticketEmail: result || {},
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadAllTickets] ', error);
      return res.status(400).json({
        success: false,
        message:
          error.message || 'Failed to load ticket email by thread number',
      });
    }
  }

  @Get('load/draft/ticket-email/:ticketid/:ticketemailtype')
  @UseGuards(AuthGuard('jwt'))
  public async loadDraftTicketEmail(
    @Param('ticketid') ticketid: string,
    @Param('ticketemailtype') ticketemailtype: TICKET_EMAIL_TYPE,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to load draft ticket email');
      ticketid = ticketid.toString() || null;
      const result: ITicketEmail = await this.ticketSvc.loadDraftTicketEmail(
        ticketid,
        ticketemailtype
      );
      res.status(200).json({
        success: true,
        ticketEmail: result || {},
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadDraftTicketEmail] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to load draft ticket email',
      });
    }
  }

  @Get('load/draft/ticket-email/:tktEmailId')
  @UseGuards(AuthGuard('jwt'))
  public async loadDraftTicketEmailById(
    @Param('tktEmailId') tktEmailId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to load draft ticket email by id');
      tktEmailId = tktEmailId.toString() || null;
      const result: ITicketEmail =
        await this.ticketSvc.loadDraftTicketEmailById(tktEmailId);
      res.status(200).json({
        success: true,
        ticketEmail: result || {},
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadDraftTicketEmailById] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to load draft ticket email by id',
      });
    }
  }

  @Post('reply-ticket')
  @UseGuards(AuthGuard('jwt'))
  public async replyOrDraftTicket(
    @Body() replyPayload: ITicketReplyData,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Incoming request to reply/forward/draft ticket');
      const emailTicket = await this.ticketSvc.replyOrDraftTicket(
        replyPayload,
        req.user
      );
      res.status(200).json({
        success: true,
        message: replyPayload.draft
          ? 'Reply has been saved as draft'
          : 'Reply has been send successfully',
        emailThread: emailTicket,
      });
    } catch (error) {
      this.logger.error('Error: Controller[replyOrDraftTicket]', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to reply the ticket',
      });
    }
  }

  @Get('load/ticket-email-threads/:ticketid')
  @UseGuards(AuthGuard('jwt'))
  public async loadTicketEmailThreads(
    @Param('ticketid') ticketid: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to ticket email threads by ticket id');
      const result: Array<ITicketEmail> =
        await this.ticketSvc.loadTicketEmailThreads(ticketid.toString());
      res.status(200).json({
        success: true,
        ticketEmails: result || [],
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadTicketEmailThreads] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to load ticket emails threads',
      });
    }
  }

  @Get('load/ticket/:ticketid')
  @UseGuards(AuthGuard('jwt'))
  public async loadTicketById(
    @Param('ticketid') ticketid: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('Imcoming request to ticket by id');
      const result: ITicket = await this.ticketSvc.loadTicketById(
        ticketid.toString()
      );
      res.status(200).json({
        success: true,
        ticket: result || [],
      });
    } catch (error) {
      this.logger.error('Error: Controller[loadTicketEmailThreads] ', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to load ticket details',
      });
    }
  }
}
