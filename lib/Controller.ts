
/**
 * 
 */
namespace Controller
{
	/** */
	export interface IController
	{
		readonly root: Element;
	}
	
	/** */
	type Constructor<T = any> = 
		(abstract new (...args: any) => T) | 
		(new (...args: any) => T);
	
	/**
	 * Returns the Controller of the specified Element,
	 * with the specified type.
	 * Returns null in the case when the controller is of a type other
	 * than the one specified.
	 * Note that elements can have multiple controllers, provided
	 * that they are of different types.
	 */
	export function get<T extends IController>(
		e: Element,
		type: Constructor<T>): T | null
	{
		let current: Element | null = e;
		
		for (;;)
		{
			const array = controllers.get(current);
			
			if (array)
				for (const obj of array)
					if (obj instanceof type)
						return obj;
			
			if (!(current.parentElement instanceof Element))
				break;
			
			current = current.parentElement;
		}
		
		return null;
	}
	
	/**
	 * Connects the specified object to the specified controller.
	 */
	export function set(controller: IController)
	{
		const array = controllers.get(controller.root) || [];
		array.push(controller);
		controllers.set(controller.root, array);
	}
	
	/**
	 * Scans upward through the DOM, starting at the specified Node, 
	 * looking for the first element whose controller matches the specified type.
	 */
	export function over<T extends IController>(
		via: Node | IController,
		type: Constructor<T>)
	{
		let current: Node | null = via instanceof Node ? via : via.root;
		
		while (current instanceof Node)
		{
			if (current instanceof Element)
			{
				const ctrl = Controller.get(current, type);
				if (ctrl)
					return ctrl;
			}
				
			current = current.parentElement;
		}
		
		throw new Error("Controller not found.");
	}
	
	/**
	 * Returns an array of Controllers of the specified type,
	 * which are extracted from the specified array of elements.
	 */
	export function map<T extends IController>(
		elements: Element[],
		type: Constructor<T>): T[]
	{
		return elements
			.map(e => get(e, type))
			.filter((o): o is T => o instanceof type);
	}
	
	/**
	 * Returns the element succeeding the specified element in the DOM
	 * that is connected to a controller of the specified type.
	 */
	export function next<T extends IController>(e: Element, type: Constructor<T>): T | null
	{
		for (;;)
		{
			e = e.nextElementSibling as Element;
			if (!(e instanceof Element))
				return null;
			
			const controller = get(e, type);
			if (controller)
				return controller;
		}
	}
	
	/**
	 * Returns the element preceeding the specified element in the DOM
	 * that is connected to a controller of the specified type.
	 */
	export function previous<T extends IController>(e: Element, type: Constructor<T>): T | null
	{
		for (;;)
		{
			e = e.previousElementSibling as Element;
			if (!(e instanceof Element))
				return null;
			
			const controller = get(e, type);
			if (controller)
				return controller;
		}
	}
	
	const controllers = new WeakMap<Element, object[]>();

	/** */
	const getControllerType = (ctrl: IController): Constructor<IController> => 
		(ctrl as any).constructor;
	
	/** */
	const childrenOf = <T extends IController>(e: Element, controllerType?: Constructor<T>) =>
	{
		let children = globalThis.Array.from(e.children);
		
		if (controllerType)
			children = children.filter(e => Controller.get(e, controllerType));
		
		return children;
	}
	
	/**
	 * 
	 */
	export class Array<TController extends IController = IController>
	{
		/** */
		constructor(
			private readonly parentElement: Element,
			private readonly controllerType: Constructor<TController>)
		{
			this.marker = document.createComment("");
			parentElement.append(this.marker);
		}
		
		private readonly marker: Comment;
		
		/** */
		toArray()
		{
			const controllers = childrenOf(this.parentElement, this.controllerType);
			return Controller.map(controllers, this.controllerType);
		}
		
		/** */
		at(index: number)
		{
			return this.toArray().at(index) || null;
		}
		
		/** */
		insert(controller: TController, index = Number.MAX_SAFE_INTEGER)
		{
			const controllers = this.toArray();
			
			if (controllers.length === 0)
			{
				this.parentElement.insertBefore(controller.root, this.marker);
			}
			else if (index >= controllers.length)
			{
				const target = controllers.at(-1) as IController;
				target.root.insertAdjacentElement("afterend", controller.root);
			}
			else
			{
				const target = controllers.at(index) as IController;
				this.parentElement.insertBefore(controller.root, target.root);
			}
		}
		
		/** */
		move(fromIndex: number, toIndex: number)
		{
			const children = childrenOf(this.parentElement, this.controllerType);
			const target = children.at(toIndex);
			const source = children.at(fromIndex);
			
			if (source && target)
				target.insertAdjacentElement("beforebegin", source);
		}
		
		/** */
		indexOf(controller: TController)
		{
			const children = childrenOf(this.parentElement, this.controllerType);
			for (let i = -1; ++i < children.length;)
				if (children[i] === controller.root)
					return i;
			
			return -1;
		}
		
		/** */
		get length()
		{
			return childrenOf(this.parentElement, this.controllerType).length;
		}
		
		/** */
		observe(callback: (mut: MutationRecord) => void)
		{
			if (this.observers.length === 0)
			{
				const mo = new MutationObserver(mutations =>
				{
					for (const mut of mutations)
						for (const fn of this.observers)
							fn(mut);
				});
				
				mo.observe(this.parentElement, { childList: true });
			}
			
			this.observers.push(callback);
		}
		
		private readonly observers: ((mut: MutationRecord) => void)[] = [];
		
		/** */
		private toJSON()
		{
			return this.toArray();
		}
	}
}
