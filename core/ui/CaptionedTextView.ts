
namespace Turf
{
	/**
	 * Base class for text objects that can render on the CaptionedBlade
	 */
	export abstract class CaptionedTextView
	{
		/** */
		constructor()
		{
			this.root = Htx.div(
				Htx.on("focusout", () =>
				{
					if (this.isEmpty)
						this.hide();
					
					this.textChangedHandler();
				}),
				Htx.on("input", () => this.maybeTriggerTextChanged())
			);
			
			this.hide();
			Controller.set(this);
		}
		
		readonly root;
		
		/** */
		protected abstract get isEmpty(): boolean;
		
		/** */
		protected hide(hide = true)
		{
			if (UI.hide(this.root, hide))
				this.hideChangedHandler(hide);
		}
		
		/** */
		setHideChangedHandler(fn: (hidden: boolean) => void)
		{
			this.hideChangedHandler = fn;
		}
		private hideChangedHandler = (hidden: boolean) => {};
		
		/** */
		setTextChangedHandler(fn: () => void)
		{
			this.textChangedHandler = fn;
		}
		private textChangedHandler = () => {};
		
		/** */
		private maybeTriggerTextChanged()
		{
			clearTimeout(this.textChangedTimeout);
			setTimeout(() => this.textChangedHandler(), 200);
		}
		private textChangedTimeout: any = 0;
	}
}
