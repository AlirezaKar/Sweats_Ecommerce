export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent: number | null;
  order: number;
  image: string | null;
};

export type ProductListItem = {
  id: number;
  title: string;
  slug: string;
  price: number;
  discounted_price: number | null;
  final_price: number;
  is_on_sale: boolean;
  stock: number;
  category_name: string;
  category_slug: string;
  main_image: string | null;
};

export type ProductDetail = ProductListItem & {
  description: string;
  detailed_description: string;
  en_title: string | null;
  category: Category;
  images: { id: number; url: string | null; alt_text: string | null; is_main: boolean }[];
  comments: {
    id: number;
    user_name: string;
    is_staff: boolean;
    title: string | null;
    text: string;
    rating: number;
    is_verified_buyer: boolean;
    created_at: string;
    replies: ThreadComment[];
  }[];
  created_at: string;
};

export type BlogPostListItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  published_at: string;
  comment_count: number;
  author_name: string;
};

export type ThreadComment = {
  id: number;
  user_name: string;
  is_staff: boolean;
  text: string;
  created_at: string;
  rating?: number;
  is_verified_buyer?: boolean;
  replies: ThreadComment[];
};

export type BlogPostDetail = BlogPostListItem & {
  body: string;
  updated_at: string;
  comments: ThreadComment[];
};

export type BlogComment = ThreadComment;

export type Tutorial = {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  video_url: string;
  duration_minutes: number;
  created_at: string;
};

export type CourseEpisode = {
  id: number;
  title: string;
  slug: string;
  order: number;
  video_url: string;
  duration_minutes: number;
  is_preview: boolean;
  description: string;
};

export type CourseListItem = {
  id: number;
  title: string;
  slug: string;
  description: string;
  instructor_name: string;
  thumbnail: string | null;
  level: string;
  level_label: string;
  is_free: boolean;
  price: number | null;
  episode_count: number;
  total_duration_minutes: number;
  first_episode_slug: string | null;
  is_enrolled: boolean;
  created_at: string;
};

export type CourseReview = {
  id: number;
  rating: number;
  text: string;
  user_name: string;
  is_approved: boolean;
  created_at: string;
};

export type CourseFile = {
  id: number;
  title: string;
  url: string | null;
  filename: string;
  content_type: string;
  order: number;
  created_at: string;
};

export type CourseDetail = CourseListItem & {
  episodes: CourseEpisode[];
};

export type Wallet = {
  balance: number;
  pending_top_up: number;
  updated_at: string;
};

export type WalletTransaction = {
  id: number;
  tx_type: string;
  tx_type_label: string;
  amount: number;
  balance_after: number;
  status: string;
  status_label: string;
  description: string;
  reference_code: string;
  created_at: string;
};

export type SupportMessage = {
  id: number;
  body: string;
  is_staff: boolean;
  author_name: string;
  created_at: string;
};

export type SupportThread = {
  id: number;
  subject: string;
  source: string;
  status: string;
  messages: SupportMessage[];
  updated_at: string;
};

export type CartLine = {
  id: number;
  product: ProductListItem;
  quantity: number;
  line_total: number;
};

export type Cart = {
  items: CartLine[];
  item_count: number;
  total_price: number;
};

export type Address = {
  id: number;
  title: string;
  province: string;
  city: string;
  postal_address: string;
  postal_code: string;
  receiver_name: string;
  receiver_phone: string;
  is_default: boolean;
  created_at: string;
};

export type OrderListItem = {
  id: number;
  status: string;
  status_label: string;
  total_price: number;
  is_paid: boolean;
  tracking_code: string | null;
  item_count: number;
  created_at: string;
};

export type OrderDetail = OrderListItem & {
  items: {
    id: number;
    product: number;
    product_title: string;
    product_slug: string;
    price: number;
    quantity: number;
    line_total: number;
  }[];
  address: Address;
};
