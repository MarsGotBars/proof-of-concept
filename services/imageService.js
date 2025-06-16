import sharp from 'sharp';

class ImageService {
    constructor() {
        this.sharp = sharp;
    }

    /**
     * Verkrijg afbeeldingsafmetingen en metadata
     * @param {Buffer|string} input - Afbeeldingsbuffer of bestandspad
     * @returns {Promise<{width: number, height: number, format: string, size: number}>}
     */
    async getImageMetadata(input) {
        try {
            const metadata = await this.sharp(input).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size
            };
        } catch (error) {
            console.error('Fout bij het ophalen van afbeeldingsmetadata:', error);
            throw error;
        }
    }

    /**
     * Verwerk afbeelding en retourneer meerdere formaten
     * @param {Buffer|string} input - Afbeeldingsbuffer of bestandspad
     * @returns {Promise<{medium: Buffer, fluid: Buffer, large: Buffer, metadata: Object}>}
     */
    async processImage(input) {
        try {
            const metadata = await this.getImageMetadata(input);
            
            // Verwerk verschillende formaten parallel
            const [medium, fluid, large] = await Promise.all([
                // Medium formaat - maximale breedte 1140px
                this.sharp(input)
                    .resize({
                        width: 1140,
                        height: undefined,
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .toBuffer(),

                // Fluid formaat - maximale breedte 1440px
                this.sharp(input)
                    .resize({
                        width: 1440,
                        height: undefined,
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .toBuffer(),

                // Groot formaat - originele grootte of maximale dimensie indien te groot
                this.sharp(input)
                    .resize({
                        width: 2560,
                        height: 2560,
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .toBuffer()
            ]);

            // Verkrijg afmetingen voor elk formaat
            const [mediumMeta, fluidMeta, largeMeta] = await Promise.all([
                this.getImageMetadata(medium),
                this.getImageMetadata(fluid),
                this.getImageMetadata(large)
            ]);

            return {
                medium: {
                    buffer: medium,
                    ...mediumMeta
                },
                fluid: {
                    buffer: fluid,
                    ...fluidMeta
                },
                large: {
                    buffer: large,
                    ...largeMeta
                },
                originalMetadata: metadata
            };
        } catch (error) {
            console.error('Fout bij het verwerken van de afbeelding:', error);
            throw error;
        }
    }

    /**
     * Optimaliseer afbeelding voor webweergave
     * @param {Buffer} imageBuffer - De afbeeldingsbuffer die geoptimaliseerd moet worden
     * @param {Object} options - Optimalisatie-opties
     * @returns {Promise<Buffer>}
     */
    async optimizeImage(imageBuffer, options = {}) {
        try {
            const defaultOptions = {
                quality: 80,
                format: 'jpeg',
                progressive: true
            };

            const finalOptions = { ...defaultOptions, ...options };

            return await this.sharp(imageBuffer)
                [finalOptions.format]({
                    quality: finalOptions.quality,
                    progressive: finalOptions.progressive
                })
                .toBuffer();
        } catch (error) {
            console.error('Fout bij het optimaliseren van de afbeelding:', error);
            throw error;
        }
    }
}

export default ImageService; 