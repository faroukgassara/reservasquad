import type { BlogRecord } from '@/lib/blog-api';

type BlogCardVariant = 'horizontal' | 'featured';

export interface IMoleculeBlogCard {
    blog: Pick<BlogRecord, 'title' | 'excerpt' | 'imageUrl' | 'slug' | 'tags' | 'publishedAt'>;
    href: string;
    variant?: BlogCardVariant;
}
