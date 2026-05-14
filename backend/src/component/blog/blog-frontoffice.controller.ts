import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { BlogService } from './blog.service';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import * as swagger from '@nestjs/swagger';

@swagger.ApiTags('blog-frontoffice')
@Controller('blog')
@Public(true)
@openApiResponse(
    { status: HttpStatus.OK, description: 'OK' },
    { status: HttpStatus.NOT_FOUND, description: 'NOT_FOUND' },
    { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class BlogFrontofficeController {
    constructor(private readonly blogService: BlogService) {}

    @Get('list')
    @swagger.ApiOperation({ summary: 'List published blog posts' })
    async list(@Res() res: Response, @Query('take') takeRaw?: string) {
        try {
            const take = Math.min(50, Math.max(1, parseInt(takeRaw ?? '12', 10) || 12));
            const blogs = await this.blogService.listPublic(take);
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

    @Get('slug/:slug')
    @swagger.ApiOperation({ summary: 'Get blog by slug' })
    async getBySlug(@Res() res: Response, @Param('slug') slug: string) {
        try {
            const blog = await this.blogService.getBySlugPublic(slug);
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
}
