import {
  URLComponent as Component,
  URL_COMPONENT_SEQUENCE as COMPONENT_SEQUENCE,
} from './components.ts';
import type { URLComponentValue as ComponentValue } from './types.ts';

const GROUPS: Partial<Record<ComponentValue, readonly ComponentValue[]>> = {
  [Component.AUTH]: [Component.USERNAME, Component.PASSWORD],
  [Component.HOST]: [Component.TLD, Component.DOMAIN, Component.SUBDOMAIN, Component.PORT],
  [Component.HOSTNAME]: [Component.TLD, Component.DOMAIN, Component.SUBDOMAIN],
  [Component.PATH]: [Component.SEGMENTS, Component.FILENAME, Component.SEARCH],
  [Component.PATHNAME]: [Component.SEGMENTS, Component.FILENAME],
} as const;

const GROUP_KEYS = Object.getOwnPropertySymbols(GROUPS) as readonly ComponentValue[];

/**
 * Adds a component group key when any of its members are present and the group is not.
 */
const appendComponentGroups = (components: readonly ComponentValue[]) =>
  GROUP_KEYS.reduce(
    (result, groupKey) => {
      const hasAnyComponents = GROUPS[groupKey]?.some(component => components.includes(component));
      const hasGroupComponent = components.includes(groupKey);

      if (hasAnyComponents && !hasGroupComponent) {
        result.push(groupKey);
      }

      return result;
    },
    [...components]
  );

/**
 * Replace component group keys with their members.
 */
const expandComponentGroups = (components: readonly ComponentValue[]) =>
  components
    .map(component => GROUPS[component] ?? component)
    .flat()
    .filter((component, i, array) => i === array.indexOf(component)); // Keep first occurrence only

/**
 * The component sequence through to `component`.
 */
const sequenceUpTo = (component: ComponentValue) =>
  COMPONENT_SEQUENCE.slice(0, COMPONENT_SEQUENCE.indexOf(component) + 1);

/**
 * Produces a new processing sequence of URL components through to `lastComponent` and with custom exclusions.
 * @param exclusions The URL components to exclude.
 * @param lastComponent The URL component at which to (inclusively) limit the sequence.
 */
export default (exclusions: readonly ComponentValue[], lastComponent: ComponentValue) => {
  exclusions = expandComponentGroups(exclusions);
  exclusions = appendComponentGroups(exclusions);
  return sequenceUpTo(lastComponent).filter(component => !exclusions.includes(component));
};
