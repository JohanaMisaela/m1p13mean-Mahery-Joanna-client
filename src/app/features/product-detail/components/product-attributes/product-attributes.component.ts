
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

        // Start with the base config
        Object.entries(config).forEach(([key, values]) => {
            merged[key] = [...values];
        });

        // Add unique values from variants
        if (prod.variants) {
            prod.variants.forEach(variant => {
                Object.entries(variant.attributes).forEach(([vKey, value]) => {
                    const strValue = value.toString();

                    // Try to find matching key (case-insensitive, handles couleur/color, taille/size)
                    const matchingKey = Object.keys(merged).find(k => k.toLowerCase() === vKey.toLowerCase());

                    if (matchingKey) {
                        // Add value if not already present
                        if (!merged[matchingKey].some(v => v.toLowerCase() === strValue.toLowerCase())) {
                            merged[matchingKey].push(strValue);
                        }
                    } else {
                        // Key doesn't exist in config - check if it's a selectable attribute or metadata
                        // Common selectable attributes: color, couleur, size, taille, etc.
                        const selectableKeys = ['color', 'couleur', 'size', 'taille', 'material', 'matériau', 'style'];
                        if (selectableKeys.some(sk => sk.toLowerCase() === vKey.toLowerCase())) {
                            // Add as new selectable attribute
                            merged[vKey] = [strValue];
                        }
                        // Otherwise it's variant-specific metadata (like "Made in") - ignore for mergedConfig
                    }
                });
            });
        }

        return merged;
    });

    // Variant-specific attributes (not in main config, like "Made in")
    variantSpecificAttributes = computed(() => {
        const variant = this.currentVariant();
        const config = this.product()?.attributeConfig;

        if (!variant || !config) return {};

        const specificAttrs: { [key: string]: string } = {};
        const configKeys = Object.keys(config);

        Object.entries(variant.attributes).forEach(([key, value]) => {
            if (!configKeys.includes(key)) {
                specificAttrs[key] = value.toString();
            }
        });

        return specificAttrs;
    });

    getAttributeKeys(): string[] {
        return Object.keys(this.mergedAttributeConfig());
    }

    selectAttribute(key: string, value: string): void {
        const current = this.selectedAttributes();
        let next: { [key: string]: string };

        if (current[key] === value) {
            next = { ...current };
            delete next[key];
        } else {
            next = { ...current, [key]: value };
        }

        // Optimistic update required for consistent UI feel if parent is slow?
        // No, standard Angular flow is wait for update. Child doesn't own state.
        this.selectionChange.emit(next);
    }

    isAttributeDisabled(key: string, value: string): boolean {
        const prod = this.product();
        if (!prod || !prod.variants || prod.variants.length === 0) {
            // No variants, allow all base product combinations
            return false;
        }

        const currentSelection = this.selectedAttributes();

        // If nothing is selected, show all available options
        if (Object.keys(currentSelection).length === 0) {
            return false;
        }

        // Helper function to match keys case-insensitively
        const keysMatch = (k1: string, k2: string): boolean => {
            return k1.toLowerCase() === k2.toLowerCase();
        };

        // Build potential selection with this new value
        // const potentialSelection = { ...currentSelection, [key]: value };

        // Find all variants that match the OTHER selected attributes (excluding the current key)
        const otherSelections = { ...currentSelection };
        delete otherSelections[key];

        // If no other attributes are selected, check if this value exists in any variant
        if (Object.keys(otherSelections).length === 0) {
            // Check if this value appears in any variant for this key
            const existsInVariant = prod.variants.some(v => {
                // Find matching key in variant attributes (case-insensitive)
                const matchingKey = Object.keys(v.attributes).find(vKey => keysMatch(vKey, key));
                if (!matchingKey) return false;

                const variantValue = v.attributes[matchingKey];
                if (!variantValue) return false;
                return variantValue.toString().toLowerCase() === value.toLowerCase();
            });

            // Also check if it's in the base config
            const config = prod.attributeConfig || {};
            const configKey = Object.keys(config).find(cKey => keysMatch(cKey, key));
            const existsInConfig = configKey ? config[configKey]?.some(v => v.toLowerCase() === value.toLowerCase()) : false;

            // Allow if it exists in either config or variants
            return !existsInConfig && !existsInVariant;
        }

        // Find variants that match all OTHER selected attributes
        const compatibleVariants = prod.variants.filter(v => {
            return Object.entries(otherSelections).every(([selKey, selValue]) => {
                // Find matching key in variant attributes (case-insensitive)
                const matchingKey = Object.keys(v.attributes).find(vKey => keysMatch(vKey, selKey));
                if (!matchingKey) return false;

                const variantValue = v.attributes[matchingKey];
                if (!variantValue) return false;
                return variantValue.toString().toLowerCase() === selValue.toString().toLowerCase();
            });
        });

        // If no compatible variants found for other selections, disable this value
        if (compatibleVariants.length === 0) {
            return true;
        }

        // Check if any of the compatible variants has this value for the current key
        const hasCompatibleValue = compatibleVariants.some(v => {
            // Find matching key in variant attributes (case-insensitive)
            const matchingKey = Object.keys(v.attributes).find(vKey => keysMatch(vKey, key));
            if (!matchingKey) return false;

            const variantValue = v.attributes[matchingKey];
            if (!variantValue) return false;
            return variantValue.toString().toLowerCase() === value.toLowerCase();
        });

        // Disable if no compatible variant has this value
        return !hasCompatibleValue;
    }

    // Helper for template to check Object keys
    get Object() { return Object; }
}
