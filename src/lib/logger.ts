import fs from 'fs';
import path from 'path';

// Define el path al archivo de log en la raíz del proyecto
const logFilePath = path.join(process.cwd(), 'error.log');

/**
 * Formatea un objeto de error en un string legible y detallado.
 * @param error El error a formatear.
 * @returns Un string formateado del mensaje de error.
 */
function formatLogMessage(error: any): string {
    const timestamp = new Date().toISOString();
    let errorMessage = `[${timestamp}] - DETAILED ERROR LOG\n`;

    // Manejo de errores de base de datos (Supabase) o similares que son objetos
    if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage += `Error Type: Database/API Error\n`;
        errorMessage += `Message: ${error.message}\n`;
        if ('code' in error) errorMessage += `Code: ${error.code}\n`;
        if ('details' in error) errorMessage += `Details: ${error.details}\n`;
        if ('hint' in error) errorMessage += `Hint: ${error.hint}\n`;
        
        // Si el objeto también es una instancia de Error, capturamos el stack
        if (error instanceof Error && error.stack) {
            errorMessage += `Stack Trace:\n${error.stack}\n`;
        }
    } 
    // Manejo de errores estándar de JavaScript
    else if (error instanceof Error) {
        errorMessage += `Error Type: Javascript Error\n`;
        errorMessage += `Name: ${error.name}\n`;
        errorMessage += `Message: ${error.message}\n`;
        if (error.stack) {
            errorMessage += `Stack Trace:\n${error.stack}\n`;
        }
    } 
    // Manejo de casos donde lo que se captura no es un objeto Error
    else {
        errorMessage += `Error Type: Non-Error Object Caught\n`;
        try {
            const prettyPrinted = JSON.stringify(error, null, 2);
            errorMessage += `Content: ${prettyPrinted}\n`;
        } catch {
            errorMessage += `Content (unserializable): ${error}\n`;
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
    console.error(message);

    // Solo intenta escribir en el archivo si estamos en un entorno de desarrollo.
    // Esto previene errores de filesystem en entornos serverless de solo lectura.
    if (process.env.NODE_ENV === 'development') {
        try {
            fs.appendFileSync(logFilePath, message, 'utf8');
        } catch (writeError) {
            console.error("Critical: Logging to file failed:", writeError);
        }
    }
}
