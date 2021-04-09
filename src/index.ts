import express, { Request, Response } from 'express';
import sharp from 'sharp';
import superagent from 'superagent';

const PORT = process.env.PORT ?? '80';
const AUTHORIZATION_HEADER = process.env.AUTHORIZATION_HEADER;
const SIZE_REGEX = /^(\d+)x(\d+)$/;
const SUPPORTED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png']);

const app = express();

///public/images/992x0/a.storyblok.com/f/106119/1200x800/bfd7828b52/devices_noe_magazin.png

async function convertImageRoute(
  request: Request,
  response: Response,
): Promise<void> {
  const startTimestamp = Date.now();
  if (request.headers['authorization'] === AUTHORIZATION_HEADER) {
    const sizeResult = SIZE_REGEX.exec(request.params.size);
    if (sizeResult) {
      const width = parseInt(sizeResult[1]);
      const height = parseInt(sizeResult[2]);

      if (width > 0 && height >= 0) {
        const imageOrigin = request.params.origin;
        const imagePath = request.params[0];
        const imageURL = `https://${imageOrigin}/${imagePath}`;

        const imageResponse = await superagent.get(imageURL);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const imageContentType = imageResponse.header['content-type'];

        if (SUPPORTED_CONTENT_TYPES.has(imageContentType)) {
          const resizedImageBuffer = await sharp(imageResponse.body)
            .resize(width, height > 0 ? height : undefined)
            .toBuffer();

          response.header('content-type', imageContentType);
          response.end(resizedImageBuffer);
          // eslint-disable-next-line no-console
          console.log(
            `SUCCESS size:"${sizeResult[0]}" image:"${imageURL}" time:${
              Date.now() - startTimestamp
            }ms`,
          );
          return;
        } else {
          response.status(400);
          response.end('Invalid image type');
        }
      } else {
        response.status(400);
        response.end('Invalid size');
      }
    } else {
      response.status(400);
      response.end('Invalid size format');
    }
  } else {
    response.status(401);
    response.end('Unauthorized');
  }
  // eslint-disable-next-line no-console
  console.log(
    `ERROR path:"${request.path}" time:${Date.now() - startTimestamp}ms`,
  );
}

app.get('/:size/:origin/*', (request, response) => {
  void convertImageRoute(request, response);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
