"use client"

import {useState, useActionState } from 'react'
import Link from 'next/link'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { IconType } from 'react-icons'

import IconComponent from '@/components/utils/IconComponent'
import { createUser } from './actions'

export default function AddUser()
{
    const [state, formAction] = useActionState(createUser, null);
    const [showPassword, setShowPassword] = useState(false);
    const [passwdType, setPasswdType] = useState('password');
    const togglePassword = () => {
        if (passwdType === 'password')
        {
            setPasswdType('text');
            setShowPassword(true);
        }
        else
        {
            setPasswdType('password');
            setShowPassword(false);
        }
    };
    return (
        <div className="min-h-screen p-8 text-black">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
                    ← Back to Main Menu
                </Link>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold uppercase tracking-tight">Add User</h1>
                    <p className="text-gray-500 mt-1 text-sm">Fill out the form below to add a new user.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8">
                    <form className="flex flex-col gap-6" action={ formAction } autoComplete="off">
                        { /* first and last name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                    FIRST NAME <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="firstName"
                                    className="input-themed p-2 text-black w-full font-mono"
                                    required
                                /> 
                            </div>
                            <div className="grid grid-cols-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                    LAST NAME 
                                </label>
                                <input
                                    name="lastName"
                                    className="input-themed p-2 text-black w-full font-mono"
                                    required
                                /> 
                            </div>
                        </div>             
                        { /* coolsys email and password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                    COOLSYS EMAIL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="email" 
                                    type="email"
                                    className="input-themed p-2 text-black w-full font-mono"
                                    required
                                /> 
                            </div>
                            <div className="grid grid-cols-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                    PASSWORD <span className="text-red-500">*</span>
                                </label>
                                <div className="flex">
                                    <input
                                        name="password"
                                        type={ passwdType }
                                        className="input-themed p-2 text-black w-full font-mono"
                                        required
                                    /> 
                                    <span className="flex justify-around items-center" onClick={ togglePassword }>
                                        <IconComponent icon={ showPassword ? FaEye : FaEyeSlash } className="absolute mr-10"/> 
                                    </span>
                                </div>
                            </div>
                        </div>             
                        { /* role */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                                    ROLE <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="role"
                                    className="input-themed p-2 text-black w-full"
                                >
                                    <option value="">UNASSIGNED</option>
                                    <option value="administrator">ADMINISTRATOR</option>
                                    <option value="projectManager">PROJECT MANAGER</option>
                                    <option value="logistician">LOGISTICIAN</option>
                                    <option value="foreman">FOREMAN</option>
                                </select>
                            </div>
                        </div>             
                        { state && (state.status.success ? <div className="bg-green-100">New user added</div> : <div className="bg-red-100">{ state.status.error }</div>) }
                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                        <button type="submit" className="btn-primary flex-1">
                            Add User
                        </button>
                        <button
                            type="button"
                            className="btn-secondary flex-1"
                        >
                            Clear Form
                        </button>
                        </div>
                    </form>
                </div>
        </div>
        </div>
    );
}