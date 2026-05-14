import { PipeTransform, ArgumentMetadata, Injectable } from '@nestjs/common';
import { DEFAULT_QUERY_LIMIT, } from 'src/config';
import { IQuery } from 'src/interface/query/query.interface';

@Injectable()
export class SearchPipe implements PipeTransform<any> {
    async transform(value: IQuery, metadata: ArgumentMetadata) {
        return {
            ...value,
            lastId: value.lastId ? value.lastId : '',
            perPage: value.perPage ? parseInt(value.perPage) : DEFAULT_QUERY_LIMIT,
            keyword: value.keyword ? value.keyword : '',
            date: value.date ? parseInt(value.date) : ""
        };
    }
}