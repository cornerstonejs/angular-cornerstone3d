// src/app/cornerstone-viewport/cornerstone-viewport.component.ts

import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { api } from 'dicomweb-client';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import {
  RenderingEngine,
  Enums,
  volumeLoader,
  Types,
  cornerstoneStreamingImageVolumeLoader,
} from '@cornerstonejs/core';
import { init as csRenderInit, cache } from '@cornerstonejs/core';
import { init as csToolsInit } from '@cornerstonejs/tools';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

volumeLoader.registerUnknownVolumeLoader(cornerstoneStreamingImageVolumeLoader);

@Component({
  selector: 'app-cornerstone-viewport',
  template: `
    <div
      #viewportElement
      [style.width.px]="512"
      [style.height.px]="512"
      [style.backgroundColor]="'#000'"
    ></div>
  `,
  standalone: true,
})
export class CornerstoneViewportComponent implements OnInit {
  @ViewChild('viewportElement', { static: true }) viewportElement!: ElementRef;
  private running = false;

  ngOnInit() {
    this.setup();
  }

  constructor(private ngZone: NgZone) {}

  async setup() {
    if (this.running) {
      return;
    }
    this.running = true;

    async function createImageIdsAndCacheMetaData({
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID = null,
      wadoRsRoot,
      client = null,
    }) {
      const SOP_INSTANCE_UID = '00080018';
      const SERIES_INSTANCE_UID = '0020000E';

      const studySearchOptions = {
        studyInstanceUID: StudyInstanceUID,
        seriesInstanceUID: SeriesInstanceUID,
      };

      client =
        client ||
        new api.DICOMwebClient({ url: wadoRsRoot as string, singlepart: true });
      const instances = await client.retrieveSeriesMetadata(studySearchOptions);
      const imageIds = instances.map((instanceMetaData) => {
        const SeriesInstanceUID =
          instanceMetaData[SERIES_INSTANCE_UID].Value[0];
        const SOPInstanceUIDToUse =
          SOPInstanceUID || instanceMetaData[SOP_INSTANCE_UID].Value[0];

        const prefix = 'wadors:';

        const imageId =
          prefix +
          wadoRsRoot +
          '/studies/' +
          StudyInstanceUID +
          '/series/' +
          SeriesInstanceUID +
          '/instances/' +
          SOPInstanceUIDToUse +
          '/frames/1';

        cornerstoneDICOMImageLoader.wadors.metaDataManager.add(
          imageId,
          instanceMetaData
        );
        return imageId;
      });

      // we don't want to add non-pet
      // Note: for 99% of scanners SUV calculation is consistent bw slices

      return imageIds;
    }

    await csRenderInit();
    await csToolsInit();
    dicomImageLoaderInit({ maxWebWorkers: 1 });

    const imageIds = await createImageIdsAndCacheMetaData({
      StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
      SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
      wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
    });

    const renderingEngineId = 'myRenderingEngine';
    const renderingEngine = new RenderingEngine(renderingEngineId);
    const viewportId = 'CT_STACK';

    const viewportInput = {
      viewportId,
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: this.viewportElement.nativeElement,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
      },
    };

    renderingEngine.enableElement(viewportInput);

    const viewport = renderingEngine.getViewport(
      viewportId
    ) as Types.IVolumeViewport;

    const volumeId = 'myVolume';
    const volume = await volumeLoader.createAndCacheVolume(volumeId, {
      imageIds,
    });

    this.ngZone.run(() => {
      (volume as any).load();

      viewport.setVolumes([{ volumeId }]);

      viewport.render();
    });

    setTimeout(() => {
      cache;
    }, 2000);
  }
}
