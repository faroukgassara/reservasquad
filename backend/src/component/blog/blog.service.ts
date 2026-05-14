import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog, EStatus } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from 'src/dto/blog/createBlog.dto';
import { UpdateBlogDto } from 'src/dto/blog/updateBlog.dto';

@Injectable()
export class BlogService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateBlogDto): Promise<Blog> {
        return this.prisma.blog.create({
            data: {
                title: dto.title,
                excerpt: dto.excerpt ?? null,
                content: dto.content ?? null,
                imageUrl: dto.imageUrl ?? null,
                slug: dto.slug,
                tags: dto.tags ?? [],
                publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
                status: dto.status ?? EStatus.ACTIVE,
            },
        });
    }

    async update(id: string, dto: UpdateBlogDto): Promise<Blog> {
        await this.getById(id);
        return this.prisma.blog.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
                ...(dto.content !== undefined && { content: dto.content }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
                ...(dto.slug !== undefined && { slug: dto.slug }),
                ...(dto.tags !== undefined && { tags: dto.tags }),
                ...(dto.publishedAt !== undefined && {
                    publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
                }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
        });
    }

    async getById(id: string): Promise<Blog> {
        const blog = await this.prisma.blog.findUnique({ where: { id } });
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        return blog;
    }

    async getBySlugPublic(slug: string): Promise<Blog> {
        const blog = await this.prisma.blog.findUnique({ where: { slug } });
        if (!blog || blog.status !== EStatus.ACTIVE) {
            throw new NotFoundException('Blog not found');
        }
        return blog;
    }

    async listAdmin(): Promise<Blog[]> {
        return this.prisma.blog.findMany({
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async listPublic(take = 12): Promise<Blog[]> {
        return this.prisma.blog.findMany({
            where: { status: EStatus.ACTIVE },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take,
        });
    }

    async delete(id: string): Promise<void> {
        await this.getById(id);
        await this.prisma.blog.delete({ where: { id } });
    }
}
