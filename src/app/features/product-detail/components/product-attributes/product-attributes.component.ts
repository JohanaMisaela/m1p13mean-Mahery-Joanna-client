import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductVariant } from '../../../../shared/models/product.model';

@Component({
  selector: 'app-product-attributes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-attributes.component.html',
  styleUrls: ['./product-attributes.component.scss'],
})
export class ProductAttributesComponent {
  // Internal signals to manage reactivity
  protected product = signal<Product | null>(null);
  protected selectedAttributes = signal<{ [key: string]: string }>({});
  protected currentVariant = signal<ProductVariant | null>(null);

  @Input({ required: true }) set Product(val: Product | null) {
    this.product.set(val);
  }

  @Input({ required: true }) set SelectedAttributes(val: { [key: string]: string }) {
    this.selectedAttributes.set(val);
  }

  @Input() set CurrentVariant(val: ProductVariant | null) {
    this.currentVariant.set(val);
  }

  @Output() selectionChange = new EventEmitter<{ [key: string]: string }>();

  // Merged attribute config: combines attributeConfig with unique values from variants
  mergedAttributeConfig = computed(() => {
    const prod = this.product();
    if (!prod) return {};

    const config = prod.attributeConfig || {};
    const merged: { [key: string]: string[] } = {};

    // Helper: case-insensitive equality with trim
    const eq = (a: string, b: string) =>
      a?.toString().trim().toLowerCase() === b?.toString().trim().toLowerCase();

    // Start with the base config
    Object.entries(config).forEach(([key, values]) => {
      merged[key] = [...values];
    });

    // Add unique values from variants
    if (prod.variants) {
      prod.variants
        .filter((v) => v.isActive !== false)
        .forEach((variant) => {
          Object.entries(variant.attributes).forEach(([vKey, value]) => {
            const strValue = value.toString();

            // Try to find matching key
            const matchingKey = Object.keys(merged).find((k) => eq(k, vKey));

            if (matchingKey) {
              if (!merged[matchingKey].some((v) => eq(v, strValue))) {
                merged[matchingKey].push(strValue);
              }
            } else {
              const selectableKeys = [
                'color',
                'couleur',
                'size',
                'taille',
                'material',
                'matériau',
                'style',
              ];
              if (selectableKeys.some((sk) => eq(sk, vKey))) {
                merged[vKey] = [strValue];
              }
            }
          });
        });
    }

    return merged;
  });

  // Attributes that are specific to the current variant and not part of the selection config
  variantSpecificAttributes = computed(() => {
    const variant = this.currentVariant();
    if (!variant || !variant.attributes) return {};

    const selectableKeys = this.getAttributeKeys().map((k) => k.toLowerCase().trim());
    const specific: { [key: string]: any } = {};

    Object.entries(variant.attributes).forEach(([key, value]) => {
      if (!selectableKeys.includes(key.toLowerCase().trim())) {
        specific[key] = value;
      }
    });

    return specific;
  });

  getAttributeKeys(): string[] {
    return Object.keys(this.mergedAttributeConfig());
  }

  // Helper to get value from selectedAttributes signal case-insensitively
  getSelectedValue(key: string): string | undefined {
    const selected = this.selectedAttributes();
    if (!selected) return undefined;

    // Try exact match first
    if (selected[key]) return selected[key];

    const actualKey = Object.keys(selected).find(
      (k) => k.trim().toLowerCase() === key.trim().toLowerCase(),
    );
    return actualKey ? selected[actualKey] : undefined;
  }

  selectAttribute(key: string, value: string): void {
    const prod = this.product();
    if (!prod || !prod.variants || prod.variants.length === 0) return;

    const equals = (a: any, b: any) =>
      a?.toString().trim().toLowerCase() === b?.toString().trim().toLowerCase();

    // 1. Build the potential new selection
    const current = { ...this.selectedAttributes() };
    const existingKey = Object.keys(current).find(
      (k) => k.trim().toLowerCase() === key.trim().toLowerCase(),
    );
    if (existingKey) delete current[existingKey];
    current[key] = value;

    // 2. Check if this exact combination exists (and is active)
    const exactMatch = prod.variants.find((v) => {
      if (v.isActive === false) return false;
      return Object.entries(current).every(([selKey, selValue]) => {
        const vKey = Object.keys(v.attributes).find((k) => equals(k, selKey));
        return vKey && equals(v.attributes[vKey], selValue);
      });
    });

    if (exactMatch) {
      this.selectionChange.emit(current);
      return;
    }

    // 3. Smart Switch: No exact match found for the combination.
    // Find the first valid (active) variant that has the newly selected value
    // and switch ALL attributes to match that variant.
    const smartFallback = prod.variants.find((v) => {
      if (v.isActive === false) return false;
      const vKey = Object.keys(v.attributes).find((k) => equals(k, key));
      return vKey && equals(v.attributes[vKey], value);
    });

    if (smartFallback) {
      this.selectionChange.emit({ ...smartFallback.attributes });
    } else {
      // Last resort: if no variant at all has this value (unlikely with disabled logic),
      // just emit the partial selection.
      this.selectionChange.emit(current);
    }
  }

  isAttributeDisabled(key: string, value: string): boolean {
    const prod = this.product();
    if (!prod || !prod.variants || prod.variants.length === 0) {
      return false;
    }

    const equals = (a: any, b: any) =>
      a?.toString().trim().toLowerCase() === b?.toString().trim().toLowerCase();

    // To allow "Smart Switch", we only disable if there is NO variant at all (active)
    // that possesses this attribute value.
    const hasAnyActiveVariantWithValue = prod.variants.some((v) => {
      if (v.isActive === false) return false;
      const vKey = Object.keys(v.attributes).find((k) => equals(k, key));
      return vKey && equals(v.attributes[vKey], value);
    });

    return !hasAnyActiveVariantWithValue;
  }

  get Object() {
    return Object;
  }
}
