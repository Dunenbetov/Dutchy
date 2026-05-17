import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolveStaticDir } from './static-dir';

const staticDir = resolveStaticDir();

@Module({
  imports: staticDir
    ? [
        ServeStaticModule.forRoot({
          rootPath: staticDir,
          exclude: ['/api*'],
          serveStaticOptions: {
            index: 'index.html',
          },
        }),
      ]
    : [],
})
export class SpaModule {}
