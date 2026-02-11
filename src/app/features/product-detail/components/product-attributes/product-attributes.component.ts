
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductVariant } from '../../../../shared/models/product.model';

@Component({
    selector: 'app-product-attributes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-attributes.component.html',
    styleUrls: ['./product-attributes.component.scss']
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
        const eq = (a: string, b: string) => a?.toString().trim().toLowerCase() === b?.toString().trim().toLowerCase();

        // Start with the base config
        Object.entries(config).forEach(([key, values]) => {
            merged[key] = [...values];
        });

        // Add unique values from variants
        if (prod.variants) {
            prod.variants.forEach(variant => {
                Object.entries(variant.attributes).forEach(([vKey, value]) => {
                    const strValue = value.toString();

                    // Try to find matching key
                    const matchingKey = Object.keys(merged).find(k => eq(k, vKey));

                    if (matchingKey) {
                        if (!merged[matchingKey].some(v => eq(v, strValue))) {
                            merged[matchingKey].push(strValue);
                        }
                    } else {
                        const selectableKeys = ['color', 'couleur', 'size', 'taille', 'material', 'matériau', 'style'];
                        if (selectableKeys.some(sk => eq(sk, vKey))) {
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

        const selectableKeys = this.getAttributeKeys().map(k => k.toLowerCase().trim());
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
        const actualKey = Object.keys(selected).find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
        return actualKey ? selected[actualKey] : undefined;
    }

    selectAttribute(key: string, value: string): void {
        const current = { ...this.selectedAttributes() };

        // Find existing key case-insensitively to ensure we toggle/update correctly
        const existingKey = Object.keys(current).find(k => k.trim().toLowerCase() === key.trim().toLowerCase());

        if (existingKey && current[existingKey] === value) {
            delete current[existingKey];
        } else {
            // Remove existing key if it has a different case, then set new one
            if (existingKey) delete current[existingKey];
            current[key] = value;
        }

        this.selectionChange.emit(current);
    }

    isAttributeDisabled(key: string, value: string): boolean {
        const prod = this.product();
        if (!prod || !prod.variants || prod.variants.length === 0) {
            return false;
        }

        const currentSelection = this.selectedAttributes();

        // Helper: case-insensitive equality
        const equals = (a: string, b: string) => a?.toString().trim().toLowerCase() === b?.toString().trim().toLowerCase();

        // Helper: find key in object case-insensitively
        const findKey = (obj: any, searchKey: string) => Object.keys(obj).find(k => equals(k, searchKey));

        // 1. Build "other" selections
        const otherAndKey: { [k: string]: string } = {};
        let hasOtherSelection = false;

        Object.entries(currentSelection).forEach(([k, v]) => {
            if (!equals(k, key)) {
                otherAndKey[k] = v;
                hasOtherSelection = true;
            }
        });

        // Always allow if no other selection - ensures base state is fully clickable
        if (!hasOtherSelection) {
            return false;
        }

        // 2. Find variants that match 'otherAndKey'
        const compatibleVariants = prod.variants.filter(variant => {
            return Object.entries(otherAndKey).every(([selKey, selValue]) => {
                const variantKey = findKey(variant.attributes, selKey);
                if (!variantKey) return false;
                return equals(variant.attributes[variantKey].toString(), selValue);
            });
        });

        // 3. Check if any compatible variant has the value we are testing
        const hasMatchingVariant = compatibleVariants.some(variant => {
            const variantKey = findKey(variant.attributes, key);
            if (!variantKey) return false;
            return equals(variant.attributes[variantKey].toString(), value);
        });

        return !hasMatchingVariant;
    }

    get Object() { return Object; }
}
