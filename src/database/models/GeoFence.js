import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
  json,
  children,
} from '@nozbe/watermelondb/decorators';
import uuid from 'react-native-uuid';
import { STATUS } from '../../constants/enums';

export default class GeoFence extends Model {
  static table = 'geo_fences';

  static associations = {
    
  };


  @field('app_id') appId;
  @field('user_id') userId;
  @json('geojson', geojson => geojson) geojson;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;


}
