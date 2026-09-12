import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
  // ImageKit (oficiální strapi-plugin-imagekit): soubory z Media Library se nahrávají do ImageKit.
  // Zapíná se až s klíči: plugin při PRVNÍM spuštění zkopíruje tento config do DB a dál bere hodnoty
  // z adminu (Settings → ImageKit) — spuštění bez klíčů by v DB „zapeklo“ prázdné hodnoty.
  imagekit: {
    enabled: Boolean(env('IMAGEKIT_PRIVATE_KEY')),
    config: {
      publicKey: env('IMAGEKIT_PUBLIC_KEY'),
      privateKey: env('IMAGEKIT_PRIVATE_KEY'),
      urlEndpoint: env('IMAGEKIT_URL_ENDPOINT'),
      enabled: true,
      useTransformUrls: false,
      useSignedUrls: false,
      expiry: 0,
      uploadEnabled: true,
      uploadOptions: {
        folder: env('IMAGEKIT_UPLOAD_FOLDER', '/gastrozony/'),
        tags: ['strapi', 'gastrozony'],
        overwriteTags: false,
        checks: '',
        isPrivateFile: false,
      },
    },
  },
});

export default config;
