// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Comprobaciones estáticas de seguridad sobre el código y la configuración del repositorio.

function listSourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);

        if (statSync(path).isDirectory()) {
            return listSourceFiles(path);
        }

        return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)
            ? [path]
            : [];
    });
}

describe('código fuente', () => {
    const files = [...listSourceFiles('src'), ...listSourceFiles('api')];

    it.each([
        ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
        ['innerHTML / outerHTML', /\.(inner|outer)HTML\b/],
        ['eval()', /\beval\s*\(/],
        ['new Function()', /new\s+Function\s*\(/],
        ['document.write', /document\.write\s*\(/],
        ['insertAdjacentHTML', /insertAdjacentHTML/],
    ])('no usa %s', (_name, pattern) => {
        const offenders = files.filter((file) =>
            pattern.test(readFileSync(file, 'utf8')),
        );

        expect(offenders).toEqual([]);
    });

    it('no contiene credenciales embebidas', () => {
        const secret = /AKIA[0-9A-Z]{16}|BEGIN (RSA )?PRIVATE KEY/;
        const offenders = files.filter((file) =>
            secret.test(readFileSync(file, 'utf8')),
        );

        expect(offenders).toEqual([]);
    });
});

describe('firestore.rules', () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    const allows = rules.match(/allow [^;]+;/g) ?? [];

    it('define reglas de acceso', () => {
        expect(allows.length).toBeGreaterThan(0);
    });

    it('ninguna regla permite acceso incondicional', () => {
        for (const rule of allows) {
            expect(rule).not.toMatch(/:\s*if\s+true\s*;/);
        }
    });

    it('toda regla exige ser dueño de la tarea', () => {
        for (const rule of allows) {
            expect(rule).toMatch(/isOwner\(/);
        }
    });

    it('create y update validan la forma del documento', () => {
        const writeRules = allows.filter((rule) =>
            /allow (create|update)/.test(rule),
        );

        expect(writeRules).toHaveLength(2);

        for (const rule of writeRules) {
            expect(rule).toMatch(/hasValidShape\(/);
        }
    });

    it('update no permite cambiar el dueño ni la fecha de creación', () => {
        expect(rules).toMatch(
            /request\.resource\.data\.userId == resource\.data\.userId/,
        );
        expect(rules).toMatch(
            /request\.resource\.data\.createdAt == resource\.data\.createdAt/,
        );
    });

    it('dueDate es el único campo opcional y se valida como YYYY-MM-DD', () => {
        expect(rules).toMatch(/hasValidDueDate\(data\)/);
        expect(rules).toMatch(/\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}/);
    });
});

describe('vercel.json', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
        headers?: { headers: { key: string; value: string }[] }[];
    };
    const headers = Object.fromEntries(
        (config.headers ?? []).flatMap((entry) =>
            entry.headers.map((header) => [header.key, header.value]),
        ),
    );

    it('envía cabeceras de seguridad', () => {
        expect(headers['X-Content-Type-Options']).toBe('nosniff');
        expect(headers['X-Frame-Options']).toBe('DENY');
        expect(headers['Referrer-Policy']).toBeTruthy();
        expect(headers['Permissions-Policy']).toBeTruthy();
    });
});
