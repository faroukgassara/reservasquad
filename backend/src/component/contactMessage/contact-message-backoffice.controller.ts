import { Controller, Delete, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContactMessageService } from './contact-message.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { FetchContactMessagesDto } from 'src/dto/contactMessage/fetchContactMessages.dto';
import {
    ApiPaginationQuery,
    PaginationQuery,
} from 'src/common/decorator/pagination-query.decorator';
import {
    ApiSortingQuery,
    SortingQuery,
} from 'src/common/decorator/sorting-query.decorator';
import {
    ApiSearchQuery,
    SearchQuery,
} from 'src/common/decorator/search-query.decorator';
import { PaginationData, SortingDecoratorOptions } from 'src/common/pagination/types';

const CONTACT_SORTING: SortingDecoratorOptions = {
    allowedFields: ['createdAt', 'name', 'email'],
    defaultSort: 'createdAt',
};

@swagger.ApiTags('contact-message-backoffice')
@Controller('backoffice/contact-message')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class ContactMessageBackofficeController {
    constructor(private readonly contactMessageService: ContactMessageService) {}

    @Get('list')
    @swagger.ApiOperation({ summary: 'List contact messages (admin)' })
    @ApiPaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
    @ApiSortingQuery(CONTACT_SORTING)
    @ApiSearchQuery({ fields: ['name', 'email', 'message'] })
    async list(
        @Res() res: Response,
        @Query() _query: FetchContactMessagesDto,
        @PaginationQuery({ defaultPage: 1, defaultPerPage: 10, maxPerPage: 100 })
        pagination: PaginationData,
        @SortingQuery(CONTACT_SORTING) orderBy: Record<string, any>[],
        @SearchQuery({ fields: ['name', 'email', 'message'] })
        searchWhere?: Record<string, any>,
    ) {
        try {
            const result = await this.contactMessageService.fetchMessages(pagination, orderBy, searchWhere);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: result,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({ summary: 'Delete contact message' })
    async delete(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.contactMessageService.delete(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Deleted successfully',
            });
        } catch (error) {
            if (error?.statusCode === HttpStatus.NOT_FOUND) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    statusCode: HttpStatus.NOT_FOUND,
                    message: error.message,
                });
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }
}
