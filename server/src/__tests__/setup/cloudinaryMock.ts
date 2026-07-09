jest.mock('../../services/cloudinary.service', () => ({
  uploadBufferToCloudinary: jest.fn(
    async (params: { buffer: Buffer; mimeType: string; originalName: string }) => {
      const resourceSegment = params.mimeType.startsWith('audio/')
        ? 'video'
        : params.mimeType.startsWith('video/')
          ? 'video'
          : 'image';
      const ext = params.originalName.includes('.')
        ? params.originalName.split('.').pop()
        : params.mimeType.split('/')[1];
      const publicId = `musica-acv/mock-${params.originalName.replace(/\.[^.]+$/, '')}`;
      return {
        publicId,
        secureUrl: `https://res.cloudinary.com/test-cloud/${resourceSegment}/upload/v1/${publicId}.${ext}`,
        bytes: params.buffer.length,
        width: params.mimeType.startsWith('image/') ? 1 : undefined,
        height: params.mimeType.startsWith('image/') ? 1 : undefined,
        duration: params.mimeType.startsWith('audio/') ? 1 : undefined,
        resourceType: resourceSegment,
      };
    },
  ),
}));
