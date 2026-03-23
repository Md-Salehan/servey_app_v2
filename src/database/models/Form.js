import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date, children } from '@nozbe/watermelondb/decorators';
import { Q } from '@nozbe/watermelondb';

export default class Form extends Model {
  static table = 'forms';

  static associations = {
    form_components: { type: 'has_many', foreignKey: 'form_id' },
  };

  @field('form_id') formId;
  @field('form_name') formName;
  @json('form_schema', schema => schema) formSchema;
  @field('app_id') appId;
  @field('description') description;
  @field('status') status; // active, inactive
  @field('priority') priority; // high, medium, low, geom
  @field('totalFields') totalFields;
  @field('estimatedTime') estimatedTime;
  @field('completionRate') completionRate;
  @field('deadline') deadline; // timestamp
  @field('surFormGenFlg') surFormGenFlg; 
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @children('form_components') components;

  async getComponents() {
    const components = await this.components.fetch();
    return components[0]?.components || [];
  }

  // Helper to check if form has components
  async hasComponents() {
    const count = await this.collections
      .get('form_components')
      .query(Q.where('form_id', this.formId))
      .fetchCount();
    return count > 0;
  }
}