import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { ncmRouter } from './routes/ncm.js';
import { classTribRouter } from './routes/classTrib.js';
import { chapterRouter } from './routes/chapter.js';
import positionRouter from './routes/position.js';
import subpositionRouter from './routes/subposition.js';
import { utilRouter } from './routes/util.js';
import relatorioRouter from "./routes/relatorio.js";
import supportRouter from './routes/support.js';


//import { importRouter } from './routes/importar.js';

const app = express();
app.use(cors());
// allow larger JSON payloads (we accept base64-encoded XLSX via JSON for now)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// rotas
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/ncm', ncmRouter);
app.use('/class-trib', classTribRouter);
app.use('/chapter', chapterRouter);
app.use('/position', positionRouter);
app.use('/subposition', subpositionRouter);
app.use('/util', utilRouter);
app.use("/relatorio", relatorioRouter);
app.use('/support', supportRouter);
//app.use('/importar-planilha', importRouter);

// fallback
app.get('/', (_, res) => res.json({ ok: true, name: 'Parametrizze API' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
