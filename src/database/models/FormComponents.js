// models/FormComponents.js
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

  // Get a specific component by its ID (fcId)
  getComponentById(fcId) {
    return this.components?.find(comp => comp.fcId === fcId) || null;
  }

  // Get all components of a specific type (e.g., 'text', 'select')
  getComponentsByType(compTyp) {
    return this.components?.filter(comp => comp.compTyp === compTyp) || [];
  }

  // Get the entire form schema (components)
  getFormSchema() {
    return this.components || [];
  }

  // Get the form details
  async getForm() {
    return await this.form.fetch();
  }
}