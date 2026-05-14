import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BlogService } from './blog.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import * as swagger from '@nestjs/swagger';
import { CreateBlogDto } from 'src/dto/blog/createBlog.dto';
import { UpdateBlogDto } from 'src/dto/blog/updateBlog.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@swagger.ApiTags('blog-backoffice')
@Controller('backoffice/blog')
@Roles({ roles: ['ADMIN'] })
@ApiBearerAuth('Authorization')
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.CREATED, description: 'CREATED' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
    { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
)
export class BlogBackofficeController {
    constructor(private readonly blogService: BlogService) {}

    @Post()
    @swagger.ApiOperation({ summary: 'Create blog post' })
    async create(@Res() res: Response, @Body() body: CreateBlogDto) {
        try {
            const dto = plainToInstance(CreateBlogDto, body);
            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Validation failed',
                    errors: errors.map((err) => ({
                        field: err.property,
                        errors: Object.values(err.constraints || {}),
                    })),
                });
            }
            const blog = await this.blogService.create(dto);
            return res.status(HttpStatus.CREATED).json({
                statusCode: HttpStatus.CREATED,
                data: blog,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }

    @Post(':id')
    @swagger.ApiOperation({ summary: 'Update blog post' })
    async update(@Res() res: Response, @Param('id') id: string, @Body() body: UpdateBlogDto) {
        try {
            const dto = plainToInstance(UpdateBlogDto, body);
            const errors = await validate(dto, { skipMissingProperties: true });
            if (errors.length > 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Validation failed',
                    errors: errors.map((err) => ({
                        field: err.property,
                        errors: Object.values(err.constraints || {}),
                    })),
                });
            }
            const blog = await this.blogService.update(id, dto);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: blog,
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

    @Get('list')
    @swagger.ApiOperation({ summary: 'List blog posts (admin)' })
    async list(@Res() res: Response) {
        try {
            const blogs = await this.blogService.listAdmin();
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                data: blogs,
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.message ?? error,
            });
        }
    }

    @Delete(':id')
    @swagger.ApiOperation({ summary: 'Delete blog post' })
    async delete(@Res() res: Response, @Param('id') id: string) {
        try {
            await this.blogService.delete(id);
            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Blog deleted successfully',
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
