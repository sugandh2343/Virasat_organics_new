import { useId,useRef,useEffect } from 'react';
export function CatalogueField({label,value,onChange,error,type='text',children,multiline=false,...props}){
 const id=useId();const Tag=multiline?'textarea':children?'select':'input';
 return <label className="catalogue-field" htmlFor={id}>{label}<Tag {...props} id={id} type={Tag==='input'?type:undefined} value={value??''} onChange={event=>onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error?id+'error':undefined}>{children}</Tag>{error&&<span className="field-error" id={id+'error'}>{error}</span>}</label>;
}
export function useFormErrorFocus(errors){const ref=useRef(null);useEffect(()=>{ref.current?.querySelector('[aria-invalid="true"]')?.focus();},[errors]);return ref;}
export const nullableNumber=value=>value===''||value==null?null:Number(value);
export const moveItem=(list,index,direction)=>{const result=[...list];const target=index+direction;if(target<0||target>=list.length)return result;[result[index],result[target]]=[result[target],result[index]];return result;};
