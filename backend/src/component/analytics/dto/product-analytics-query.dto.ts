import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProductAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format or YYYY-MM-DD',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format or YYYY-MM-DD',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of top products to return (omit to return all products)',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter analytics and breakdown by specific product UUID',
    example: 'd19e075c-4f9e-4c4c-83b3-8ec2e9e2db34',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter analytics by product category UUID',
    example: 'd19e075c-4f9e-4c4c-83b3-8ec2e9e2db34',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Interval grouping for trend chart: "day" or "month"',
    enum: ['day', 'month'],
  })
  @IsOptional()
  @IsString()
  interval?: 'day' | 'month';
}
