
namespace Turf
{
	/** */
	export class BackgroundManager
	{
		/** */
		constructor(
			private readonly record: CaptionedBladeRecord,
			private readonly renderTarget: HTMLElement)
		{
			let imagesConfigurators: HTMLElement;
			
			this.configuratorElement = Htx.div(
				"background-manager",
				imagesConfigurators = Htx.div(
					"background-manager-images",
					{
						marginBottom: "20px",
					}
				),
				new ColorConfigurator(this.record, this.renderTarget).root
			);
			
			this.previews = new Controller.Array(this.renderTarget, BackgroundPreview);
			this.configurators = new Controller.Array(imagesConfigurators, BackgroundConfigurator);
			
			for (const bg of record.backgrounds)
				if (bg.media)
					this.addBackground(bg.media);
			
			this.configurators.observe(() =>
			{
				const records = this.configurators!.toArray().map(r => r.record);
				this.record.backgrounds = records;
			});
		}
		
		readonly configuratorElement;
		private readonly configurators;
		private readonly previews;
		
		/** */
		addBackground(media: MediaRecord)
		{
			const backgroundRecord = new BackgroundRecord();
			backgroundRecord.media = media;
			const preview = BackgroundPreview.new(backgroundRecord);
			const cfg = new BackgroundConfigurator(backgroundRecord, preview);
			this.configurators.insert(cfg);
			this.previews.insert(cfg.preview);
		}
	}
	
	/** */
	class BackgroundConfigurator
	{
		/** */
		constructor(
			readonly record: BackgroundRecord,
			readonly preview: BackgroundPreview)
		{
			this.root = Htx.div(
				"background-configurator",
				Htx.css(" + .background-configurator", { marginTop: "10px" }),
				{
					display: "flex",
				},
				Htx.div(
					"mini-preview",
					{
						width: "75px",
						height: "75px",
						borderRadius: UI.borderRadius.default
					},
					this.renderMiniPreview(record)
				),
				Htx.div(
					{
						flex: "1 0",
						padding: "0 25px",
					},
					(this.sizeSlider = new Slider(...this.getSizeParams(false))).root
				),
				this.coverButton = UI.clickLabel(
					{
						padding: "20px",
					},
					...this.getSizeParams(true),
					new Text("Cover")
				),
				UI.clickLabel(
					{
						padding: "20px",
					},
					Htx.on(UI.clickEvt, ev => UI.springMenu(ev.target, {
						"Move Up": () => {},
						"Move Down": () => {},
						"Delete": () => this.root.remove(),
					})),
					
					new Text("?????????"),
				),
			);
			
			if (this.preview instanceof BackgroundImagePreview)
			{
				const bip = this.preview;
				this.sizeSlider.setProgressChangeFn(() =>
				{
					bip.setSize(this.sizeSlider.progress);
				});
				
				this.setUsingCover(record.size < 0);
			}
			
			UI.removeTogether(this.root, this.preview.root);
			Controller.set(this);
		}
		
		readonly root;
		private readonly coverButton;
		private readonly sizeSlider;
		
		/** */
		private renderMiniPreview(record: BackgroundRecord): Htx.Param
		{
			const cls = Util.getMimeClass(record);
			
			if (cls === MimeClass.image)
			{
				return {
					backgroundColor: UI.gray(50),
					backgroundImage: record.media!.getBlobCssUrl(),
					backgroundSize: "contain",
				};
			}
			
			if (cls === MimeClass.video)
			{
				return RenderUtil.createVideoBackground(
					record.media!.getBlobUrl(),
					record.media!.type);
			}
			
			return false;
		}
		
		/** */
		private getSizeParams(useCover: boolean)
		{
			return [
				{
					transitionProperty: "opacity",
					transitionDuration: "0.2s",
				},
				Htx.on("pointerdown", () =>
				{
					this.setUsingCover(useCover);
				})
			];
		}
		
		/** */
		private setUsingCover(usingCover: boolean)
		{
			if (!(this.preview instanceof BackgroundImagePreview))
				return;
			
			this.coverButton.style.opacity = usingCover ? "1" : "0.5";
			this.sizeSlider.root.style.opacity = usingCover ? "0.5" : "1";
			
			if (usingCover)
				this.sizeSlider.progress = this.sizeSlider.max;
			
			this.record.size = usingCover ? -1 : this.sizeSlider.progress;
			this.preview.setSize(this.record.size);
		}
	}
	
	/** */
	abstract class BackgroundPreview
	{
		/** */
		static new(record: BackgroundRecord)
		{
			return Util.getMimeClass(record) === MimeClass.video ?
				new BackgroundVideoPreview(record) :
				new BackgroundImagePreview(record);
		}
		
		/** */
		constructor(readonly record: BackgroundRecord) { }
		
		abstract readonly root: HTMLElement;
	}
	
	/** */
	class BackgroundVideoPreview extends BackgroundPreview
	{
		/** */
		constructor(record: BackgroundRecord)
		{
			super(record);
			
			const blobUrl = record.media?.getBlobUrl() || "";
			const mimeType = record.media?.type || "";
			
			this.root = Htx.div(
				"background-video-preview",
				UI.anchor(),
				RenderUtil.createVideoBackground(blobUrl, mimeType)
			);
			
			Controller.set(this);
		}
		
		readonly root;
	}
	
	/** */
	class BackgroundImagePreview extends BackgroundPreview
	{
		/** */
		constructor(record: BackgroundRecord)
		{
			super(record);
			
			this.root = Htx.div(
				"background-image-preview",
				UI.anchor(),
				
				Htx.on("pointerdown", () =>
				{
					this.imgContainer.setPointerCapture(1);
				}),
				Htx.on("pointerup", () =>
				{
					this.imgContainer.releasePointerCapture(1);
				}),
				Htx.on("pointermove", ev =>
				{
					if (ev.buttons === 1)
						this.handleImageMove(ev.movementX, ev.movementY);
				}),
				this.imgBoundary = Htx.div(
					"image-boundary",
					this.imgContainer = Htx.div(
						"image-container",
						Htx.css(":before", {
							content: `""`,
							...UI.anchor(-4),
							border: "3px dashed white",
							borderRadius: UI.borderRadius.default
						}),
						{
							userSelect: "none",
							cursor: "move",
						},
						this.img = Htx.img(
							{
								src: record.media?.getBlobUrl(),
								display: "block",
								userSelect: "none",
								pointerEvents: "none",
							},
							Htx.on("load", async () =>
							{
								[this.imgWidth, this.imgHeight] = await RenderUtil.getDimensions(this.img.src);
								this.setSize(this.size);
							})
						),
					)
				)
			);
			
			this.size = record.size;
			Controller.set(this);
		}
		
		readonly root;
		private readonly imgContainer;
		private readonly imgBoundary;
		private readonly img;
		
		private imgWidth = 0;
		private imgHeight = 0;
		
		/** */
		async setSize(size: number)
		{
			this.size = size;
			
			if (size < 0)
			{
				Htx.from(this.imgBoundary)(
					UI.anchor()
				);
				
				Htx.from(this.imgContainer, this.img)({
					width: "100%",
					height: "100%",
					transform: "none",
				});
				
				Htx.from(this.img)({
					objectFit: "cover",
					objectPosition: "50% 50%",
				});
			}
			else
			{
				Htx.from(this.imgContainer)({
					width: "min-content",
					height: "min-content",
					transform: "translateX(-50%) translateY(-50%)"
				});
				
				const s = this.img.style;
				if (this.imgWidth > this.imgHeight)
				{
					s.width = size + "vmin";
					s.height = "auto";
				}
				else
				{
					s.width = "auto";
					s.height = size + "vmin";
				}
				
				await UI.wait();
				
				Htx.from(this.imgBoundary)(
					UI.anchor(this.img.offsetHeight / 2, this.img.offsetWidth / 2),
					{
						width: "auto",
						height: "auto",
					}
				);
				
				await UI.wait();
			}
			
			this.updateImagePosition();
		}
		private size = -1;
		
		/** */
		private handleImageMove(deltaX: number, deltaY: number)
		{
			const boundaryWidth = this.imgBoundary.offsetWidth;
			const boundaryHeight = this.imgBoundary.offsetHeight;
			
			let [x, y] = this.record.position;
			
			const xPct = ((deltaX / boundaryWidth) || 0) * 100;
			const yPct = ((deltaY / boundaryHeight) || 0) * 100;
			
			x = Math.max(0, Math.min(100, x + xPct));
			y = Math.max(0, Math.min(100, y + yPct));
			this.record.position = [x, y];
			
			this.updateImagePosition();
		}
		
		/** */
		private updateImagePosition()
		{
			const [x, y] = this.record.position;
			
			if (this.size < 0)
			{
				this.imgContainer.style.left = "0";
				this.imgContainer.style.top = "0";
				this.img.style.objectPosition = `${100 - x}% ${100 - y}%`;
			}
			else
			{
				this.imgContainer.style.left = x + "%";
				this.imgContainer.style.top = y + "%";
				this.img.style.removeProperty("object-position");
			}
		}
	}
}
