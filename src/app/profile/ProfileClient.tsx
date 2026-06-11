"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateProfileDetails, updateUserPassword } from "@/app/actions/customer-profile";

const BANGLADESH_DISTRICTS = [
  "Chattogram",
  "Dhaka",
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogra",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chuadanga",
  "Comilla",
  "Cox's Bazar",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jaipurhat",
  "Jamalpur",
  "Jessore",
  "Jhalokati",
  "Jhenaidah",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon"
];

const profileDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Please enter a valid Bangladeshi mobile number"),
  district: z.string().min(1, "Please select a district"),
  area: z.string().min(1, "Please select or type an area"),
  fullAddress: z.string().min(5, "Address must be at least 5 characters"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type ProfileDetailsInput = z.infer<typeof profileDetailsSchema>;
type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

interface ProfileClientProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    district: string | null;
    area: string | null;
    fullAddress: string | null;
  };
  chattogramAreas: string[];
}

export default function ProfileClient({ user, chattogramAreas }: ProfileClientProps) {
  const [isPendingDetails, startDetailsTransition] = useTransition();
  const [isPendingPassword, startPasswordTransition] = useTransition();

  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [isOtherArea, setIsOtherArea] = useState(false);

  // Form 1: Profile Details Form
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    control: controlDetails,
    setValue: setValueDetails,
    formState: { errors: errorsDetails },
  } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      district: user.district || "",
      area: user.area || "",
      fullAddress: user.fullAddress || "",
    },
  });

  const watchedDistrict = useWatch({ control: controlDetails, name: "district" });
  const watchedArea = useWatch({ control: controlDetails, name: "area" });

  useEffect(() => {
    if (user.district === "Chattogram" && user.area && !chattogramAreas.includes(user.area)) {
      setTimeout(() => setIsOtherArea(true), 0);
    }
  }, [user.district, user.area, chattogramAreas]);

  // Form 2: Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmitDetails = (data: ProfileDetailsInput) => {
    setDetailsSuccess(null);
    setDetailsError(null);

    startDetailsTransition(async () => {
      const res = await updateProfileDetails(data);
      if (res.success) {
        setDetailsSuccess("Profile details updated successfully.");
      } else {
        setDetailsError(res.error || "Failed to update profile details.");
      }
    });
  };

  const onSubmitPassword = (data: UpdatePasswordInput) => {
    setPasswordSuccess(null);
    setPasswordError(null);

    startPasswordTransition(async () => {
      const res = await updateUserPassword(data);
      if (res.success) {
        setPasswordSuccess("Password updated successfully.");
        resetPassword();
      } else {
        setPasswordError(res.error || "Failed to update password.");
      }
    });
  };

  const handleAreaSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsOtherArea(true);
      setValueDetails("area", "");
    } else {
      setIsOtherArea(false);
      setValueDetails("area", val);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
          My Account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal shipping information and account security passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Details Form (takes 7 columns on desktop) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 font-sans">
              Profile Details
            </h2>
            <p className="text-xs text-slate-400">
              Keep your default shipping address updated for quick future checkouts.
            </p>
          </div>

          <form onSubmit={handleSubmitDetails(onSubmitDetails)} className="space-y-4">
            {detailsSuccess && (
              <div className="flex gap-2 items-center p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-none">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{detailsSuccess}</span>
              </div>
            )}

            {detailsError && (
              <div className="flex gap-2 items-center p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-none">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{detailsError}</span>
              </div>
            )}

            {/* Email (Read-only) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full h-12 border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500 rounded-none cursor-not-allowed outline-hidden"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                {...registerDetails("name")}
                className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                  errorsDetails.name ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              />
              {errorsDetails.name && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsDetails.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g., 01825462039"
                {...registerDetails("phone")}
                className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                  errorsDetails.phone ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              />
              {errorsDetails.phone && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsDetails.phone.message}</p>
              )}
            </div>

            {/* District */}
            <div>
              <label htmlFor="district" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                District
              </label>
              <select
                id="district"
                {...registerDetails("district", {
                  onChange: () => {
                    setValueDetails("area", "");
                    setIsOtherArea(false);
                  }
                })}
                className={`w-full h-12 border px-3 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none cursor-pointer transition-all ${
                  errorsDetails.district ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              >
                <option value="">Select District...</option>
                {BANGLADESH_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              {errorsDetails.district && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsDetails.district.message}</p>
              )}
            </div>

            {/* Area */}
            <div>
              <label htmlFor="area" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Area / Thana / Upazila
              </label>
              {watchedDistrict === "Chattogram" ? (
                <div className="space-y-3">
                  <select
                    id="area-select"
                    onChange={handleAreaSelectChange}
                    value={isOtherArea ? "Other" : watchedArea || ""}
                    className={`w-full h-12 border px-3 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none cursor-pointer transition-all ${
                      errorsDetails.area ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                    }`}
                  >
                    <option value="">Select Area...</option>
                    {chattogramAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                    <option value="Other">Other (Outside Chattogram City / Upazila)</option>
                  </select>

                  {isOtherArea && (
                    <input
                      type="text"
                      placeholder="Enter Thana / Upazila name"
                      value={watchedArea}
                      onChange={(e) => setValueDetails("area", e.target.value, { shouldValidate: true })}
                      className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                        errorsDetails.area ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                      }`}
                    />
                  )}
                </div>
              ) : (
                <input
                  id="area"
                  type="text"
                  placeholder={watchedDistrict ? "Enter Thana / Upazila" : "Select district first"}
                  disabled={!watchedDistrict}
                  {...registerDetails("area")}
                  className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                    errorsDetails.area ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                  }`}
                />
              )}
              {errorsDetails.area && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsDetails.area.message}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="fullAddress" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Full Address
              </label>
              <textarea
                id="fullAddress"
                rows={3}
                placeholder="Street address, house, road details..."
                {...registerDetails("fullAddress")}
                className={`w-full border p-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none resize-none transition-all ${
                  errorsDetails.fullAddress ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              />
              {errorsDetails.fullAddress && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsDetails.fullAddress.message}</p>
              )}
            </div>

            {/* Details Submit button */}
            <button
              type="submit"
              disabled={isPendingDetails}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-none transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPendingDetails ? "Saving Details..." : "Save Details"}
            </button>
          </form>
        </div>

        {/* Right Column: Security Password Form (takes 5 columns on desktop) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 font-sans">
              Security
            </h2>
            <p className="text-xs text-slate-400">
              Update your password configuration regularly to protect your account.
            </p>
          </div>

          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            {passwordSuccess && (
              <div className="flex gap-2 items-center p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-none">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex gap-2 items-center p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-none">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                {...registerPassword("currentPassword")}
                className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                  errorsPassword.currentPassword ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              />
              {errorsPassword.currentPassword && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsPassword.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...registerPassword("newPassword")}
                className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                  errorsPassword.newPassword ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              />
              {errorsPassword.newPassword && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsPassword.newPassword.message}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmNewPassword" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                placeholder="••••••••"
                {...registerPassword("confirmNewPassword")}
                className={`w-full h-12 border px-4 text-sm bg-slate-50 focus:bg-white outline-hidden text-slate-800 rounded-none transition-all ${
                  errorsPassword.confirmNewPassword ? "border-rose-500" : "border-slate-200 focus:border-slate-900"
                }`}
              />
              {errorsPassword.confirmNewPassword && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errorsPassword.confirmNewPassword.message}</p>
              )}
            </div>

            {/* Password Submit button */}
            <button
              type="submit"
              disabled={isPendingPassword}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-none transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPendingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
