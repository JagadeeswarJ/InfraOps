import { readFileSync } from 'fs';
import { join } from 'path';

export interface TemplateData {
    [key: string]: string | number | undefined;
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
     * Replace variables in template
     * Replaces {{variable}} with values from data object
     */
    static renderTemplate(template: string, data: TemplateData): string {
        let rendered = template;

        // Replace all {{variable}} with actual values
        Object.keys(data).forEach(key => {
            const value = data[key] || '';
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, String(value));
        });

        // Remove any leftover template variables
        rendered = rendered.replace(/{{[^}]+}}/g, '');

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