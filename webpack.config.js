const path = require('path');

module.exports = {
    experiments: {
        outputModule: true,
    },
    resolve: {
        alias: {
            '@cornerstonejs/dicom-image-loader': path.resolve(__dirname, 'node_modules/@cornerstonejs/dicom-image-loader'),
        },
    }
};
