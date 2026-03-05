import { Model } from '@nozbe/watermelondb';
import { field, json, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class FormComponents extends Model {
  static table = 'form_components';

  static associations = {
    forms: { type: 'belongs_to', key: 'form_id' },
  };

  @field('form_id') formId;
  @json('components', components => components) components;
  @field('version') version;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('forms', 'form_id') form;

  // Get component by ID
  getComponentById(fcId) {
    return this.components?.find(comp => comp.fcId === fcId) || null;
  }

  // Get components by type
  getComponentsByType(compTyp) {
    return this.components?.filter(comp => comp.compTyp === compTyp) || [];
  }
}