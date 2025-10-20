import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { ncmRouter } from './routes/ncm.js';
import { classTribRouter } from './routes/classTrib.js';
import { utilRouter } from './routes/util.js';
//import { relatorioRouter } from './routes/relatorios.js';
//import { importRouter } from './routes/importar.js';

const app = express();
app.use(cors());
app.use(express.json());

// rotas
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/ncm', ncmRouter);
app.use('/class-trib', classTribRouter);
app.use('/util', utilRouter);
//app.use('/relatorios', relatorioRouter);
//app.use('/importar-planilha', importRouter);

// fallback
app.get('/', (_, res) => res.json({ ok: true, name: 'Parametrizze API' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
