import { readFileSync } from 'fs';
import { join } from 'path';

export interface TemplateData {
    [key: string]: any;
}

export class TemplateLoader {
    private static templateCache: Map<string, string> = new Map();
    private static templatesPath = join(process.cwd(), 'src', 'templates', 'emails');

    /**
     * Load email template from file
     */
    static loadTemplate(templateName: string): string {
        // Check cache first
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!;
        }

        try {
            const templatePath = join(this.templatesPath, `${templateName}.html`);
            const template = readFileSync(templatePath, 'utf-8');
            
            // Cache the template
            this.templateCache.set(templateName, template);
            return template;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            throw new Error(`Template ${templateName} not found`);
        }
    }

    /**
     * Get nested property value from object using dot notation
     */
    private static getNestedValue(obj: any, path: string): any {
        if (!obj || !path) return '';
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined) return '';
            current = current[key];
        }
        
        return current !== undefined && current !== null ? current : '';
    }

    /**
     * Enhanced template renderer with support for:
     * - Nested properties: {{user.name}}, {{ticket.title}}
     * - Simple conditionals: {{#if condition}}...{{/if}}
     * - Simple loops: {{#each array}}...{{/each}}
     * - Default values: {{value || default}}
     */
    static renderTemplate(template: string, data: TemplateData): string {
        let rendered = template;

        console.log('🎨 Template rendering started with data keys:', Object.keys(data));
        console.log('🎨 Data structure preview:', {
            user: data.user ? { name: data.user.name, email: data.user.email } : 'undefined',
            ticket: data.ticket ? { 
                id: data.ticket.id, 
                title: data.ticket.title, 
                category: data.ticket.category,
                imagesCount: data.ticket.images?.length || 0
            } : 'undefined',
            dataKeys: data.data ? Object.keys(data.data) : 'undefined'
        });

        // Handle simple loops: {{#each array}}...{{/each}}
        rendered = rendered.replace(/{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g, (match, arrayPath, content) => {
            const arrayData = this.getNestedValue(data, arrayPath.trim());
            if (!Array.isArray(arrayData) || arrayData.length === 0) {
                return '';
            }

            return arrayData.map((item, index) => {
                let itemContent = content;
                
                // Replace {{this}} with current item value
                if (typeof item === 'string' || typeof item === 'number') {
                    itemContent = itemContent.replace(/{{this}}/g, String(item));
                } else if (typeof item === 'object' && item !== null) {
                    // Replace {{this.property}} with item properties
                    Object.keys(item).forEach(key => {
                        const regex = new RegExp(`{{this\\.${key}}}`, 'g');
                        itemContent = itemContent.replace(regex, String(item[key] || ''));
                    });
                }

                // Handle @index, @first, @last
                itemContent = itemContent.replace(/{{@index}}/g, String(index));
                itemContent = itemContent.replace(/{{@first}}/g, String(index === 0));
                itemContent = itemContent.replace(/{{@last}}/g, String(index === arrayData.length - 1));

                return itemContent;
            }).join('');
        });

        // Handle conditionals: {{#if condition}}...{{/if}}
        rendered = rendered.replace(/{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
            const value = this.getNestedValue(data, condition.trim());
            const isTrue = value && 
                          (Array.isArray(value) ? value.length > 0 : 
                           typeof value === 'boolean' ? value : 
                           value !== '' && value !== 0);
            return isTrue ? content : '';
        });

        // Handle default values: {{value || default}}
        rendered = rendered.replace(/{{([^}]+)\s*\|\|\s*'([^']+)'}}/g, (match, path, defaultValue) => {
            const value = this.getNestedValue(data, path.trim());
            return value || defaultValue;
        });

        // Handle nested properties: {{user.name}}, {{ticket.title}}
        rendered = rendered.replace(/{{([^}]+)}}/g, (match, path) => {
            const cleanPath = path.trim();
            
            // Skip already processed patterns
            if (cleanPath.includes('#') || cleanPath.includes('/')) {
                return match;
            }

            const value = this.getNestedValue(data, cleanPath);
            const result = String(value || '');
            
            console.log(`🔍 Replacing {{${cleanPath}}} with: "${result}"`);
            return result;
        });

        console.log('✅ Template rendering completed');
        return rendered;
    }

    /**
     * Load template and render with data in one step
     */
    static loadAndRender(templateName: string, data: TemplateData): string {
        const template = this.loadTemplate(templateName);
        return this.renderTemplate(template, data);
    }

    /**
     * Clear template cache (useful for development)
     */
    static clearCache(): void {
        this.templateCache.clear();
    }
}

export default TemplateLoader;