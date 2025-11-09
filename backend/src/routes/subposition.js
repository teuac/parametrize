import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ensureAuth, ensureAdmin } from '../middlewares/auth.js';

const prisma = new PrismaClient();
export const subpositionRouter = Router();

subpositionRouter.use(ensureAuth);

// List all subpositions
subpositionRouter.get('/', async (req, res) => {
	try {
		const rows = await prisma.subposition.findMany({ orderBy: { subposition_code: 'asc' } });
		res.json(rows);
	} catch (err) {
		console.error('Erro ao listar subposições', err);
		res.status(500).json({ error: 'Erro ao listar subposições' });
	}
});

// Get single subposition by id
subpositionRouter.get('/:id', async (req, res) => {
	try {
		const id = Number(req.params.id);
		const row = await prisma.subposition.findUnique({ where: { id } });
		if (!row) return res.status(404).json({ error: 'Subposição não encontrada' });
		res.json(row);
	} catch (err) {
		console.error('Erro ao buscar subposição', err);
		res.status(500).json({ error: 'Erro ao buscar subposição' });
	}
});

// Admin: create
subpositionRouter.post('/', ensureAdmin, async (req, res) => {
	try {
		const data = req.body;
		const created = await prisma.subposition.create({ data });
		res.status(201).json(created);
	} catch (err) {
		console.error('Erro ao criar subposição', err);
		res.status(500).json({ error: 'Erro ao criar subposição' });
	}
});

// Admin: update
subpositionRouter.put('/:id', ensureAdmin, async (req, res) => {
	try {
		const id = Number(req.params.id);
		const data = req.body;
		const updated = await prisma.subposition.update({ where: { id }, data });
		res.json(updated);
	} catch (err) {
		console.error('Erro ao atualizar subposição', err);
		res.status(500).json({ error: 'Erro ao atualizar subposição' });
	}
});

// Admin: delete
subpositionRouter.delete('/:id', ensureAdmin, async (req, res) => {
	try {
		const id = Number(req.params.id);
		await prisma.subposition.delete({ where: { id } });
		res.json({ ok: true });
	} catch (err) {
		console.error('Erro ao excluir subposição', err);
		res.status(500).json({ error: 'Erro ao excluir subposição' });
	}
});

export default subpositionRouter;
