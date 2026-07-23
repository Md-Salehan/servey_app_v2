// models/LovCache.js
import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class LovCache extends Model {
  static table = 'lov_cache';

  static associations = {
    forms: { type: 'belongs_to', key: 'form_id' },
  };

  @field('app_id') appId;
  @field('form_id') formId;
  @field('fc_id') fcId;

  @field('par_id') parId;
  @field('query') query;
//   @field('parent_value') parentValue;

  @field('data') data;          // JSON string of the option array
  @field('columns') columns;    // JSON string of column definitions
  @field('primary_key') primaryKey;
  @field('display_key') displayKey;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('forms', 'form_id') form;
}