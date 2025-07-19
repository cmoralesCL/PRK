import fs from 'fs';
import path from 'path';

// Define el path al archivo de log en la raíz del proyecto
const logFilePath = path.join(process.cwd(), 'error.log');

/**
 * Formatea un objeto de error en un string legible.
 * @param error El error a formatear.
 * @returns Un string formateado del mensaje de error.
 */
function formatLogMessage(error: any): string {
    const timestamp = new Date().toISOString();
    let errorMessage = `[${timestamp}] - DETAILED ERROR LOG\n`;

    if (error instanceof Error) {
        errorMessage += `Name: ${error.name}\n`;
        errorMessage += `Message: ${error.message}\n`;
        // Incluye información específica de errores de Supabase si está disponible
        if ('details' in error) errorMessage += `Details: ${error.details}\n`;
        if ('hint' in error) errorMessage += `Hint: ${error.hint}\n`;
        if ('code' in error) errorMessage += `Code: ${error.code}\n`;
        
        if (error.stack) {
            errorMessage += `Stack Trace:\n${error.stack}\n`;
        }
    } else {
        // Maneja casos donde lo que se captura no es un objeto Error
        try {
            errorMessage += `Caught non-error object: ${JSON.stringify(error, null, 2)}\n`;
        } catch {
            errorMessage += `Caught non-serializable object: ${error}\n`;
        }
    }

    errorMessage += '--------------------------------------------------\n\n';
    return errorMessage;
}

/**
 * Registra un error en la consola y, si está en desarrollo, en un archivo de log.
 * @param error El error a registrar.
 */
export function logError(error: any): void {
    const message = formatLogMessage(error);

    // Siempre registra en la consola para máxima visibilidad en cualquier entorno
    console.error("--- DETAILED ERROR LOG ---");
    console.error(message);
    console.error("--- END OF LOG ---");


    // Solo intenta escribir en el archivo si estamos en un entorno de desarrollo.
    // Esto previene errores de filesystem en entornos serverless de solo lectura.
    if (process.env.NODE_ENV === 'development') {
        try {
            fs.appendFileSync(logFilePath, message, 'utf8');
        } catch (writeError) {
            console.error("Logging to file failed:", writeError);
        }
    }
}
