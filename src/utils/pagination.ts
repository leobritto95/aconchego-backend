import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Extrai e valida os parâmetros de paginação da query string
 * @param req - Request do Express
 * @param defaultLimit - Limite padrão (padrão: 10)
 * @returns Objeto com page, limit e skip
 */
export const getPaginationParams = (
  req: Request,
  defaultLimit: number = 10
): PaginationParams => {
  const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, Number.parseInt(req.query.limit as string) || defaultLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Calcula os metadados de paginação
 * @param total - Total de itens
 * @param page - Página atual
 * @param limit - Limite por página
 * @returns Objeto com informações de paginação
 */
export const getPaginationResult = (
  total: number,
  page: number,
  limit: number
): PaginationResult => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
  };
};

