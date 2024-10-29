// src/app/cornerstone-viewport/cornerstone-viewport.component.ts

import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { createImageIdsAndCacheMetaData, initDemo } from '../../lib';
import {
  RenderingEngine,
  Enums,
  volumeLoader,
  Types,
  cornerstoneStreamingImageVolumeLoader,
} from '@cornerstonejs/core';
import * as cornerstone from '@cornerstonejs/core';
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
    this.ngZone.runOutsideAngular(() => {
      this.setup();
    });
  }

  constructor(private ngZone: NgZone) {}

  async setup() {
    if (this.running) {
      return;
    }
    this.running = true;

    await initDemo();

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

    (volume as any).load();

    viewport.setVolumes([{ volumeId }]);

    viewport.render();

    setTimeout(() => {
      debugger;
    }, 2000);
  }
}
