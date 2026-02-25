// src/app/cornerstone-viewport/cornerstone-viewport.component.ts

import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { api } from 'dicomweb-client';
import { init as dicomImageLoaderInit, wadors } from '@cornerstonejs/dicom-image-loader';
import {
  RenderingEngine,
  Enums,
  volumeLoader,
  getWebWorkerManager,
  type Types,
  init as csRenderInit,
} from '@cornerstonejs/core';
import { init as csToolsInit } from '@cornerstonejs/tools';

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
      // @ts-ignore
      StudyInstanceUID,
      // @ts-ignore
      SeriesInstanceUID,
      // @ts-ignore
      SOPInstanceUID = null,
      // @ts-ignore
      wadoRsRoot,
      // @ts-ignore
      client = null,
    }) {
      const SOP_INSTANCE_UID = '00080018';
      const SERIES_INSTANCE_UID = '0020000E';

      const studySearchOptions = {
        studyInstanceUID: StudyInstanceUID,
        seriesInstanceUID: SeriesInstanceUID,
      };

      const dicomClient: api.DICOMwebClient =
        client ||
        new api.DICOMwebClient({ url: wadoRsRoot as string, singlepart: true });

      // dicomweb-client 0.11 types require 'request'; runtime accepts it optional
      const instances = await dicomClient.retrieveSeriesMetadata(
        studySearchOptions as Parameters<api.DICOMwebClient['retrieveSeriesMetadata']>[0]
      );
      const imageIds = instances.map((instanceMetaData) => {
        const meta = instanceMetaData as Record<string, { Value?: string[] }>;
        const seriesUID = meta[SERIES_INSTANCE_UID]?.Value?.[0];
        if (!seriesUID) {
          throw new Error('Series Instance UID not found in metadata');
        }
        const sopUID = meta[SOP_INSTANCE_UID]?.Value?.[0];
        const SOPInstanceUIDToUse =
          SOPInstanceUID || sopUID;
        if (!SOPInstanceUIDToUse) {
          throw new Error('SOP Instance UID not found in metadata');
        }

        const prefix = 'wadors:';

        const imageId =
          prefix +
          wadoRsRoot +
          '/studies/' +
          StudyInstanceUID +
          '/series/' +
          seriesUID +
          '/instances/' +
          SOPInstanceUIDToUse +
          '/frames/1';

        wadors.metaDataManager.add(imageId, instanceMetaData as never);
        return imageId;
      });

      // we don't want to add non-pet
      // Note: for 99% of scanners SUV calculation is consistent bw slices

      return imageIds;
    }

    csRenderInit();
    csToolsInit();
    // Register our worker first so init() does not register the broken @fs/... worker (dev)
    const workerUrl = new URL(
      'cs-dicom-loader/decodeImageFrameWorker.js',
      document.baseURI || window.location.origin + '/'
    ).href;
    getWebWorkerManager().registerWorker(
      'dicomImageLoader',
      () => new Worker(workerUrl, { type: 'module' }),
      { maxWorkerInstances: 1, overwrite: true }
    );
    dicomImageLoaderInit({ maxWebWorkers: 1 });

    const imageIds = await createImageIdsAndCacheMetaData({
      StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
      SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
      wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
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

    (volume as any).load();

    viewport.setVolumes([{ volumeId }]);

    viewport.render();
  }
}
