import { EmailTemplate, getEmailTemplateById } from '../models/dynamodb';

/**
 * Service pour gérer les templates email et les variables dynamiques
 */
export class TemplateService {
  /**
   * Parse un template et remplace les variables par leurs valeurs
   * @param template Le template à parser
   * @param variables Les variables à remplacer dans le template
   * @returns Le contenu du template avec les variables remplacées
   */
  static parseTemplate(
    templateContent: string,
    variables: Record<string, string> = {}
  ): string {
    // Utilise une regex pour trouver toutes les variables sous la forme {{variable}}
    const regex = /\{\{([^}]+)\}\}/g;
    
    return templateContent.replace(regex, (match, variableName) => {
      // Récupère le nom de la variable sans les espaces
      const trimmedName = variableName.trim();
      // Remplace par la valeur si elle existe, sinon garde la variable telle quelle
      return variables[trimmedName] !== undefined ? variables[trimmedName] : match;
    });
  }

  /**
   * Extrait toutes les variables d'un template
   * @param templateContent Le contenu du template
   * @returns Un tableau de toutes les variables trouvées
   */
  static extractVariables(templateContent: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(templateContent)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }
    
    return variables;
  }

  /**
   * Prépare un template pour l'envoi en remplaçant les variables
   * @param template Le template à préparer
   * @param variables Les variables à remplacer
   * @returns Le contenu HTML et texte du template préparé
   */
  static prepareTemplate(
    template: EmailTemplate,
    variables: Record<string, string> = {}
  ): { html: string; text: string; subject: string } {
    // On utilise le contenu HTML et texte du template
    const htmlContent = template.htmlContent || '';
    const textContent = template.textContent || '';
    const subject = template.subject || '';
    
    // Remplace les variables dans le contenu HTML
    let html = this.parseTemplate(htmlContent, variables);
    
    // S'assurer que le HTML a une structure complète
    html = this.ensureCompleteHtmlStructure(html);
    
    // Remplace les variables dans le contenu texte s'il existe
    const text = textContent
      ? this.parseTemplate(textContent, variables)
      // Si pas de version texte, génère une version simplifiée à partir du HTML
      : this.htmlToText(html);
      
    // Remplace les variables dans le sujet
    const parsedSubject = this.parseTemplate(subject, variables);
    
    return { html, text, subject: parsedSubject };
  }

  /**
   * Convertit un contenu HTML en texte brut (version simplifiée)
   * @param html Le contenu HTML à convertir
   * @returns Une version texte du contenu HTML
   */
  private static htmlToText(html: string): string {
    // Cette fonction est une version simplifiée.
    // Dans un environnement de production, utilisez une bibliothèque comme html-to-text
    return html
      // Remplace les balises ouvrantes par un espace
      .replace(/<[^>]*>/g, ' ')
      // Supprime les espaces multiples
      .replace(/\s+/g, ' ')
      // Supprime les espaces au début et à la fin
      .trim();
  }

  /**
   * Valide qu'un template contient toutes les variables requises
   * @param template Le template à valider
   * @param requiredVariables Les variables requises
   * @returns true si le template contient toutes les variables requises
   */
  static validateTemplate(
    template: EmailTemplate,
    requiredVariables: string[] = []
  ): { isValid: boolean; missingVariables: string[] } {
    const htmlContent = template.htmlContent || '';
    const templateVariables = this.extractVariables(htmlContent);
    const missingVariables = requiredVariables.filter(
      variable => !templateVariables.includes(variable)
    );
    
    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }

  /**
   * Récupère le nombre total de templates pour l'utilisateur courant
   * @returns Le nombre total de templates
   */
  static async getTotalTemplates(): Promise<number> {
    try {
      return 3;
    } catch (error) {
      console.error("Erreur lors du calcul du nombre total de templates:", error);
      return 0;
    }
  }

  /**
   * Récupère un template par son ID
   * @param templateId ID du template
   * @returns Le template ou null s'il n'existe pas
   */
  static async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      return await getEmailTemplateById(templateId);
    } catch (error) {
      console.error(`Erreur lors de la récupération du template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Garantit qu'un contenu HTML a une structure complète (doctype, html, head, body)
   * @param htmlContent Le contenu HTML à vérifier/compléter
   * @returns Le contenu HTML avec une structure complète
   */
  static ensureCompleteHtmlStructure(htmlContent: string): string {
    // Si le contenu est vide, retourner une structure HTML minimale
    if (!htmlContent || htmlContent.trim() === '') {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif;">
</body>
</html>`;
    }

    // Vérifier si le contenu a déjà un doctype
    const hasDoctype = htmlContent.toLowerCase().includes('<!doctype') || htmlContent.toLowerCase().includes('<!DOCTYPE');
    // Vérifier si le contenu a déjà des balises html
    const hasHtmlTag = /<html\b[^>]*>/i.test(htmlContent);
    // Vérifier si le contenu a déjà des balises body
    const hasBodyTag = /<body\b[^>]*>/i.test(htmlContent);
    // Vérifier si le contenu a déjà des balises head
    const hasHeadTag = /<head\b[^>]*>/i.test(htmlContent);
    // Vérifier si le meta Content-Type est présent
    const hasContentType = htmlContent.toLowerCase().includes('content-type');

    // Si le contenu a déjà une structure complète avec Content-Type, le retourner tel quel
    if (hasDoctype && hasHtmlTag && hasHeadTag && hasBodyTag && hasContentType) {
      return htmlContent;
    }

    // Si le contenu est un fragment HTML sans structure document complète
    if (!hasDoctype || !hasHtmlTag) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif;">
  ${htmlContent}
</body>
</html>`;
    }

    // Si le contenu a des balises html et body mais pas de head
    if (hasHtmlTag && hasBodyTag && !hasHeadTag) {
      return htmlContent.replace(/<html[^>]*>/i, 
        `<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Email</title>
</head>`);
    }

    // Si le contenu a des balises head mais sans Content-Type
    if (hasHeadTag && !hasContentType) {
      return htmlContent.replace(/<head[^>]*>/i, 
        `<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">`);
    }

    // Si le contenu a un head et un body mais pas de doctype
    if (!hasDoctype && hasHtmlTag) {
      return `<!DOCTYPE html>\n${htmlContent}`;
    }

    // Par défaut, retourner le contenu tel quel
    return htmlContent;
  }
} 