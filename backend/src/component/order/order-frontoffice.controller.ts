import { Body, Controller, Headers, HttpStatus, Post, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as swagger from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { openApiResponse } from 'src/common/decorator/open-api.decorator';
import { sendCaughtError } from 'src/common/utils/caught-error.util';
import { CreateOrderDto } from 'src/dto/order/createOrder.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from './order.service';

@swagger.ApiTags('order-frontoffice')
@Controller('order')
@Public(true)
@openApiResponse(
  { status: HttpStatus.CREATED, description: 'CREATED' },
  { status: HttpStatus.BAD_REQUEST, description: 'BAD_REQUEST' },
  { status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'INTERNAL_SERVER_ERROR' },
)
export class OrderFrontofficeController {
  constructor(
    private readonly orderService: OrderService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @swagger.ApiOperation({ summary: 'Place a shop order (public / optional auth)' })
  async create(
    @Body() body: CreateOrderDto,
    @Headers('authorization') authorization: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const dto = plainToInstance(CreateOrderDto, body);
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

      const authUser = await this.resolveOptionalUser(authorization);
      const created = await this.orderService.create(dto, {
        userId: authUser?.id,
        email: authUser?.email,
        phone: authUser?.phone,
        firstName: authUser?.firstName,
        lastName: authUser?.lastName,
      });

      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        data: created,
      });
    } catch (error: unknown) {
      return sendCaughtError(res, error);
    }
  }

  private async resolveOptionalUser(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authorization.slice('Bearer '.length).trim();
      const payload = this.jwtService.verify<{ id?: string }>(token);
      if (!payload?.id) return null;

      return this.prisma.user.findFirst({
        where: { id: payload.id, deletedAt: null },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true },
      });
    } catch {
      return null;
    }
  }
}
