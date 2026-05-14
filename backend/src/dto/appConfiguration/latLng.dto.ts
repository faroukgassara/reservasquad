import { ApiProperty } from "@nestjs/swagger";
import { IsLatLng, LatLng } from "src/common/validators/latLng.validator";

export class LatLngDto {
    @ApiProperty()
    @IsLatLng()
    latLng: LatLng
}