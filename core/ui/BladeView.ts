
namespace Turf
{
	/** */
	export abstract class BladeView
	{
		/** */
		static new(record: BladeRecord)
		{
			if (record instanceof CaptionedBladeRecord)
				return new CaptionedBladeView(record);
			
			if (record instanceof GalleryBladeRecord)
				return new GalleryBladeView(record);
			
			if (record instanceof ProseBladeRecord)
				return new ProseBladeView(record);
			
			if (record instanceof VideoBladeRecord)
				return new VideoBladeView(record);
			
			throw "Unknown record type.";
		}
		
		/** */
		constructor(readonly record: BladeRecord)
		{
			const headerPadding = "25px";
			
			this.root = Htx.div(
				"blade-view",
				
				// Hide the transition configurator for the first blade view
				Htx.css(":first-of-type .transition-configurator { visibility: hidden; }"),
				
				// 
				Htx.css(":not(:last-of-type) .final-add { display: none; }"),
				
				// Controls header
				Htx.div(
					"blade-header",
					{
						display: "flex",
						height: "100px",
						paddingLeft: headerPadding,
						paddingRight: headerPadding,
					},
					Htx.div(
						"transition-configurator",
						{
							display: "flex",
							alignItems: "stretch",
							flex: "1 0",
						},
						this.transitionAnchor = Htx.a(
							UI.clickable,
							{
								fontSize: "25px",
							},
							UI.flexVCenter,
							Htx.on(UI.click, () => this.handleTransition())
						),
					),
					Htx.div(
						UI.flexVCenter,
						UI.plusButton(
							Htx.on(UI.click, () => this.handleAdd("beforebegin")),
						),
					),
					...UI.dripper(
						new Text("Add Here"),
						Htx.on("drop", ev =>
						{
							
						})
					)
				),
				
				//
				this.sceneContainer = Htx.div(
					"scene-container",
					{
						overflow: "hidden",
						height: UI.vsize(100), 
						backgroundColor: UI.white(0.1),
					},
				),
				
				//
				this.configuratorButtonsContainer = Htx.div(
					"config-buttons-container",
					{
						width: "max-content",
						maxWidth: "100%",
						margin: "auto",
						paddingBottom: "20px",
						overflowX: "auto",
						overflowY: "scroll",
						color: "white",
						textAlign: "center",
						whiteSpace: "nowrap",
					}
				),
				
				//
				(this.configuratorContainer = new HeightBox(
					"config-container",
					{
						padding: "0 30px 30px"
					}
				)).root,
				
				// Final add
				Htx.div(
					"final-add",
					{
						direction: "rtl",
						padding: headerPadding,
						paddingLeft: "0",
					},
					UI.plusButton(
						Htx.on(UI.click, () => this.handleAdd("afterend")),
					),
				)
			);
			
			// Populate this with data in the future.
			this.transition = Transitions.slide;
			
			Htx.from(this.moreButton.root)(
				Htx.on(UI.click, ev => UI.springMenu(ev.target, {
					"Move Up": () => {},
					"Move Down": () => {},
					"Delete": () => this.root.remove(),
				}))
			);
			
			Controller.set(this);
			Saver.set(this);
		}
		
		readonly root: HTMLDivElement;
		readonly sceneContainer;
		readonly configuratorButtonsContainer;
		readonly configuratorContainer;
		
		/** */
		protected setBladeButtons(
			changedFn: () => void,
			...bladeButtons: BladeButtonView[])
		{
			this._bladeButtons = bladeButtons;
			
			for (const bb of bladeButtons)
			{
				this.configuratorButtonsContainer.append(bb.root);
				bb.setSelectedChangedFn(changedFn);
			}	
			
			this.configuratorButtonsContainer.append(
				...bladeButtons.map(bb => bb.root),
				this.moreButton.root
			);
		}
		
		/** */
		get bladeButtons(): readonly BladeButtonView[]
		{
			return this._bladeButtons;
		}
		private _bladeButtons: BladeButtonView[] = [];
		
		private readonly moreButton = new BladeButtonView("•••", {
			selectable: false,
		});
		
		/** */
		protected setBladeConfigurator(e: HTMLElement | null)
		{
			this.configuratorContainer.setItem(e);
		}
		
		/** */
		private async handleAdd(where: InsertPosition)
		{
			const view = await AddBladeView.show(this.root);
			if (view)
				this.root.insertAdjacentElement(where, view.root);
		}
		
		/** */
		private handleTransition()
		{
			// Display the transition screen and then set the local property when done
		}
		
		/** */
		get transition()
		{
			return this._transition;
		}
		set transition(value: Animation)
		{
			this._transition = value;
			this.transitionAnchor.innerHTML = `<b>Transition</b>&nbsp;&#8212; ${value.label}`;
		}
		private _transition = Transitions.slide;
		
		private readonly transitionAnchor: HTMLAnchorElement;
		
		/** */
		protected createDripper(title: string, dropFn: (dt: DataTransfer) => void)
		{
			return UI.dripper(
				new Text(title),
				UI.flexCenter,
				{
					backgroundColor: UI.color({ l: 20, a: 0.85 }),
					border: "3px solid " + UI.color({ l: 20 }),
					borderRadius: UI.borderRadius.default,
					fontSize: "40px",
					fontWeight: "700",
					color: "white"
				},
				Htx.on("drop", ev =>
				{
					(ev.target as HTMLElement)?.remove();
					
					if (ev.dataTransfer)
						dropFn(ev.dataTransfer);
				})
			);
		}
		
		/** */
		protected createMediaRecord(ev: DragEvent)
		{
			const dt = ev.dataTransfer!;
			if (dt.files.length === 0)
				return null;
			
			const file = dt.files[0];
			const mimeType = MimeType.from(file.type);
			if (!mimeType)
				return null;
			
			const record = new MediaRecord();
			record.blob = new Blob([file]);
			record.name = file.name;
			record.type = mimeType;
			return record;
		}
		
		/**
		 * A number between -1 (fully black) and 1 (fully white) that
		 * indicates the amount of contrast to render with.
		 * A value of 0 removes the text contrast from the element.
		 */
		protected setContrast(e: HTMLElement, amount: number)
		{
			e.classList.remove(
				CssClass.textContrast,
				CssClass.textContrastDark,
				CssClass.textContrastLight);
			
			e.style.removeProperty(ConstS.textContrastProperty);
			
			if (amount !== 0)
			{
				e.classList.add(
					CssClass.textContrast,
					amount > 0 ?
						CssClass.textContrastDark : 
						CssClass.textContrastLight);
				
				e.style.setProperty(ConstS.textContrastProperty, Math.abs(amount).toString());
			}
		}
		
		/** */
		abstract save(): void;
	}
}
