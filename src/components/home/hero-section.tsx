"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PhilippinesMap } from "./philippines-map";
import { LiveActivity } from "./live-activity";
import { MatchAnimation } from "./match-animation";
import { SearchBox } from "./search-box";
import { DEMO_ACTIVITIES, type LiveActivityItem } from "./home-data";
import { CATEGORIES } from "@/lib/validation";
