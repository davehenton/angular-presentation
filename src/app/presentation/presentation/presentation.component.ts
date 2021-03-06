import { Component, ContentChildren, EventEmitter, forwardRef, Input, OnInit, Output, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Mode } from '../mode.enum';
import { AnalyticsService } from '../analytics.service';
import { SlideComponent } from '../slide/slide.component';
declare const ga;

@Component({
  selector: 'slides-presentation',
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationComponent implements OnInit {
  private generatedSlideIndex = 0;
  private activeMode: Mode = Mode.none;
  public config = {
    resize: false,
    hideControls: false
  };


  @Input() activeSlideIndex = 0;
  @Input() milestone?: string;
  @Input() public width = 1800;
  @Input() public height = 1000;
  @Input() public zoom = 1;

  @Output() onSlideChange = new EventEmitter<number>();
  @Output() onSlideAdded = new EventEmitter<{ index: number, id: string }>();
  @Output() onModeChange = new EventEmitter<Mode>();

  @ContentChildren(forwardRef(() => SlideComponent)) slides: QueryList<SlideComponent>;

  // Expose enum to template
  modeEnum = Mode;

  constructor(private route: ActivatedRoute, private analytics: AnalyticsService) {
    this.mode = this.route.snapshot.queryParams['mode'] || this.mode;
    if (this.route.snapshot.queryParams['mini']) {
      this.width = 1280;
      this.height = 720;
    }
    this.milestone = this.route.snapshot.queryParams['milestone'];
    this.config.hideControls = this.route.snapshot.queryParams['hideControls'] || this.config.hideControls;
    this.config.resize = this.route.snapshot.queryParams['resize'] || this.config.resize;
  }

  get mode(): Mode {
    return this.activeMode;
  }

  set mode(value: Mode) {
    this.activeMode = value;
    this.onModeChange.next(value);
  }

  get totalSlides() {
    return this.generatedSlideIndex;
  }

  ngOnInit(): void {
    this.trackProgress();
  }


  registerSlide(id: string, milestone: string) {
    if (this.milestone && milestone !== this.milestone) {
      return;
    }
    const index = this.generatedSlideIndex++;
    this.onSlideAdded.next({index, id});
    return index;
  }

  // TODO: Move out to a separate module;
  trackProgress() {
    const path = this.route.parent.snapshot.routeConfig && this.route.parent.snapshot.routeConfig.path || 'index';

    if (this.activeSlideIndex === 0) {
      const key = `been-here-mileston-start-${path}`;
      const time = +Date.now();
      localStorage.setItem(key, time.toString());
      this.analytics.sendEvent('milestone', 'start', path);

    }

    if (this.generatedSlideIndex > 0 && this.activeSlideIndex === this.generatedSlideIndex - 1) {
      const key = `been-here-mileston-end-${path}`;
      const startTime = parseInt(localStorage.getItem(`been-here-mileston-start-${path}`), 10) || (+Date.now());
      const time = (+Date.now()) - startTime;
      localStorage.setItem(key, 'yes');
      this.analytics.sendEvent('milestone', 'end', path);
      this.analytics.sendTiming('milestone', 'complete', time, path);
    }
  }


// TODO: This is a hack, need a proper way!
  isIntroJsOpen() {
    return !!document.querySelector('.introjs-overlay');
  }

  nextSlide() {
    if (this.canGoNext()) {
      this.goToSlide(this.activeSlideIndex + 1);
    }
  }

  previousSlide() {
    if (this.canGoPrevious()) {
      this.goToSlide(this.activeSlideIndex - 1);
    }
  }

  canGoNext(): boolean {
    return this.activeSlideIndex + 1 < this.generatedSlideIndex && !this.isIntroJsOpen();
  }

  canGoPrevious(): boolean {
    return this.activeSlideIndex > 0 && !this.isIntroJsOpen();
  }

  goToSlide(index) {
    this.activeSlideIndex = index;
    this.onSlideChange.next(index);
    this.trackProgress();
  }


  disableResize() {
    // TODO
  }

}
