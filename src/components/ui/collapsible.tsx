'use client';

import {
  Collapsible as RadixCollapsible,
  CollapsibleContent as RadixCollapsibleContent,
  CollapsibleTrigger as RadixCollapsibleTrigger,
} from '@radix-ui/react-collapsible';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

export const Collapsible = forwardRef<
  ElementRef<typeof RadixCollapsible>,
  ComponentPropsWithoutRef<typeof RadixCollapsible>
>((props, ref) => (
  <RadixCollapsible ref={ref} {...props} />
));

export const CollapsibleTrigger = forwardRef<
  ElementRef<typeof RadixCollapsibleTrigger>,
  ComponentPropsWithoutRef<typeof RadixCollapsibleTrigger>
>((props, ref) => (
  <RadixCollapsibleTrigger ref={ref} {...props} />
));

export const CollapsibleContent = forwardRef<
  ElementRef<typeof RadixCollapsibleContent>,
  ComponentPropsWithoutRef<typeof RadixCollapsibleContent>
>((props, ref) => (
  <RadixCollapsibleContent ref={ref} {...props} />
));