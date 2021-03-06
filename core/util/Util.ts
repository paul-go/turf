
namespace Turf
{
	/** */
	export type Constructor<T = any> = 
		(abstract new (...args: any) => T) | 
		(new (...args: any) => T);
	
	/** */
	export namespace Util
	{
		/**
		 * Returns the constructor function of the specified object.
		 */
		export function constructorOf<T extends Object>(object: T): Constructor<T>
		{
			return (object as any).constructor;
		}
		
		/**
		 * Generates a short unique string value containing the base 36 character set.
		 */
		export function unique()
		{
			let now = Date.now() - 1648215698766;
			if (now <= lastNow)
				return (++lastNow).toString(36);
			
			lastNow = now;
			return now.toString(36);
		}
		let lastNow = 0;
		
		/**
		 * Loads the specified JavaScript code file into the browser,
		 * if it has not already done so.
		 */
		export async function include(src: string)
		{
			if (includedScripts.has(src))
				return;
			
			includedScripts.add(src);
			
			if (DEBUG && ELECTRON)
			{
				const path = require("path") as typeof import("path");
				src = "file://" + path.join(__dirname, src);
			}
			
			return new Promise<boolean>(resolve =>
			{
				if (src.endsWith(".js"))
				{
					const script = document.createElement("script");
					script.src = src;
					script.onload = () =>
					{
						script.remove();
						resolve(true);
					};
					script.onerror = () =>
					{
						console.error("Failed to load: " + src);
						resolve(false);
					}
					document.head.append(script);
				}
				else if (src.endsWith(".css"))
				{
					const link = document.createElement("link");
					link.rel = "stylesheet";
					link.type = "text/css";
					link.href = src;
					link.onload = () => resolve(true);
					link.onerror = () => resolve(false);
					document.head.append(link);
				}
			});
		}
		const includedScripts = new Set<string>();
		
		/**
		 * Removes all child nodes from the specified Element.
		 */
		export function clear(e: Element)
		{
			for (let i = e.childNodes.length; i-- > 0;)
				e.childNodes[i].remove();
		}
		
		/**
		 * Returns the two specified Node instances in DOM order.
		 */
		export function orderElements<T extends Node>(nodeA: T, nodeB: T): [T, T]
		{
			const cmp = nodeA.compareDocumentPosition(nodeB);
			const following = window.Node.DOCUMENT_POSITION_FOLLOWING;
			const forward = cmp === 0 || (cmp & following) === following;
			
			return [
				forward ? nodeA : nodeB,
				forward ? nodeB : nodeA
			];
		}
		
		/**
		 * Returns a CSS url() value which is compatible with the
		 * testing environment.
		 */
		export function createCssUrl(url: string)
		{
			if (DEBUG && ELECTRON)
			{
				const path = require("path") as typeof import("path");
				const val = path.join(__dirname, url);
				return `url(${val})`;
			}
			
			return `url(${url})`;
		}
		
		//# Record Related
		
		/**
		 * 
		 */
		export function getMimeClass(record: BackgroundRecord)
		{
			const media = record.media;
			return media ?
				MimeType.getClass(media.type) :
				null;
		}
		
		/**
		 * 
		 */
		export function generatePatchSlug()
		{
			const date = new Date();
			return (
				date.getFullYear() + 
				"-" + 
				("0" + (date.getMonth() + 1)).slice(-2) + 
				"-" +
				("0" + (date.getDate() + 1)).slice(-2));
		}
		
		/**
		 * Performs a deep traversal on all Records that are descendents
		 * of the record specified.
		 */
		export function * eachDeepRecord(via: Record)
		{
			function * recurse(record: Record): IterableIterator<Record>
			{
				yield record;
				
				for (const child of Object.values(record))
				{
					if (child instanceof Record)
						yield * recurse(child);
					
					if (Array.isArray(child) && Array.length > 0 && child[0] instanceof Record)
						for (const recordInArray of child)
							yield * recurse(recordInArray);
				}
			}
			
			yield * recurse(via);
		}
	}
}
