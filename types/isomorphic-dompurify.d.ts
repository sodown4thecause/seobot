declare module 'isomorphic-dompurify' {
  interface DOMPurifyI {
    sanitize(dirty: string | Node, config?: DOMPurify.Config): string;
    setConfig(cfg: DOMPurify.Config): void;
    clearConfig(): void;
    isSupported: boolean;
    version: string;
    removed: Array<any>;
    addHook(entryPoint: string, hookFunction: DOMPurify.HookFunction): void;
    removeHook(entryPoint: string): void;
    removeHooks(entryPoint: string): void;
    removeAllHooks(): void;
  }

  namespace DOMPurify {
    interface Config {
      ADD_ATTR?: string[];
      ADD_DATA_URI_TAGS?: string[];
      ADD_TAGS?: string[];
      ADD_URI_SAFE_ATTR?: string[];
      ALLOW_DATA_ATTR?: boolean;
      ALLOW_UNKNOWN_PROTOCOLS?: boolean;
      ALLOWED_ATTR?: string[];
      ALLOWED_TAGS?: string[];
      ALLOWED_URI_REGEXP?: RegExp;
      FORBID_ATTR?: string[];
      FORBID_CONTENTS?: string[];
      FORBID_TAGS?: string[];
      FORCE_BODY?: boolean;
      IN_PLACE?: boolean;
      KEEP_CONTENT?: boolean;
      NAMESPACE?: string;
      PARSER_MEDIA_TYPE?: string;
      RETURN_DOM?: boolean;
      RETURN_DOM_FRAGMENT?: boolean;
      RETURN_DOM_IMPORT?: boolean;
      RETURN_TRUSTED_TYPE?: boolean;
      SAFE_FOR_JQUERY?: boolean;
      SAFE_FOR_TEMPLATES?: boolean;
      SANITIZE_DOM?: boolean;
      USE_PROFILES?: { html?: boolean; svg?: boolean; svgFilters?: boolean; mathMl?: boolean };
      WHOLE_DOCUMENT?: boolean;
    }

    type HookFunction = (node: Element, data: any, config: Config) => Element | void;
  }

  const DOMPurify: DOMPurifyI;
  export default DOMPurify;
}
