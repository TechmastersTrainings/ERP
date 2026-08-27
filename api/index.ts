import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';

const server = express();
let isInitialized = false;

async function bootstrapServerless() {
  if (!isInitialized) {
    let AppModule: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('../dist/src/app.module.js');
      AppModule = mod.AppModule;
    } catch {
      // Fallback for TS dev environment
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('../src/app.module');
      AppModule = mod.AppModule;
    }

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );
    app.enableCors();
    const publicPath = join(process.cwd(), 'public');
    server.use(express.static(publicPath));
    await app.init();
    isInitialized = true;
  }
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    await bootstrapServerless();
    server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Boot Error:', err);
    res.status(500).json({
      error: 'Vercel Serverless Initialization Error',
      message: err?.message || String(err),
    });
  }
}
